import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Called from automation (entity event) OR directly from frontend (sign-off action)
    const { action, risk_id, signer_stakeholder_id } = body;

    if (action === "signoff") {
      // Leadership sign-off: move to Approved and notify
      return await handleSignOff(base44, risk_id, signer_stakeholder_id);
    }

    // Called from entity automation — body has event + data
    const { event, data, old_data, changed_fields } = body;

    if (!data || !event) {
      return Response.json({ message: "No event data" }, { status: 200 });
    }

    const riskId = event.entity_id;
    const newOwnerSet = data.owner_stakeholder_id && !old_data?.owner_stakeholder_id;
    const ownerChanged = changed_fields?.includes("owner_stakeholder_id") && data.owner_stakeholder_id;

    if ((newOwnerSet || ownerChanged) && data.status === "identified") {
      // Move to Pending Review
      await base44.asServiceRole.entities.Risk.update(riskId, {
        status: "pending_review",
        workflow_status_history: [
          ...(data.workflow_status_history || []),
          {
            status: "pending_review",
            actor: "system",
            timestamp: new Date().toISOString(),
            comments: `Owner assigned (${data.owner || data.owner_stakeholder_id}). Moved to Pending Review.`
          }
        ]
      });

      // Email the owner
      if (data.owner_stakeholder_id) {
        const stakeholders = await base44.asServiceRole.entities.Stakeholder.filter({ id: data.owner_stakeholder_id });
        const owner = stakeholders[0];
        if (owner?.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: owner.email,
            subject: `Risk Assigned to You: ${data.title}`,
            body: `Hello ${owner.full_name},\n\nYou have been assigned as the Risk Owner for:\n\nRisk: ${data.title}\nCategory: ${data.category}\nStatus: Pending Review\n\nPlease review and take appropriate action.\n\nThank you.`
          });
        }
      }

      // Notify Leadership group members
      await notifyLeadership(base44, data, "pending_review");
    }

    return Response.json({ message: "Processed" }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleSignOff(base44, riskId, signerStakeholderId) {
  // Verify signer is in Leadership group
  const signer = (await base44.asServiceRole.entities.Stakeholder.filter({ id: signerStakeholderId }))[0];
  if (!signer) {
    return Response.json({ error: "Stakeholder not found" }, { status: 404 });
  }

  // Find Leadership group for this company
  const groups = await base44.asServiceRole.entities.StakeholderGroup.filter({
    company_id: signer.company_id,
    name: "Leadership"
  });
  const leadershipGroupId = groups[0]?.id;

  if (!leadershipGroupId || !signer.group_ids?.includes(leadershipGroupId)) {
    return Response.json({ error: "Signer must be a member of the Leadership group" }, { status: 403 });
  }

  const risk = (await base44.asServiceRole.entities.Risk.filter({ id: riskId }))[0];
  if (!risk) {
    return Response.json({ error: "Risk not found" }, { status: 404 });
  }

  if (risk.status !== "pending_review") {
    return Response.json({ error: "Risk must be in Pending Review status to sign off" }, { status: 400 });
  }

  // Move to Approved
  await base44.asServiceRole.entities.Risk.update(riskId, {
    status: "approved",
    workflow_status_history: [
      ...(risk.workflow_status_history || []),
      {
        status: "approved",
        actor: signer.full_name,
        timestamp: new Date().toISOString(),
        comments: `Approved by ${signer.full_name} (Leadership)`
      }
    ]
  });

  // Notify the risk owner
  if (risk.owner_stakeholder_id) {
    const owner = (await base44.asServiceRole.entities.Stakeholder.filter({ id: risk.owner_stakeholder_id }))[0];
    if (owner?.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: owner.email,
        subject: `Risk Approved: ${risk.title}`,
        body: `Hello ${owner.full_name},\n\nThe following risk has been approved by Leadership:\n\nRisk: ${risk.title}\nApproved by: ${signer.full_name}\nDate: ${new Date().toLocaleDateString()}\n\nThank you.`
      });
    }
  }

  return Response.json({ message: "Risk approved successfully", status: "approved" }, { status: 200 });
}

async function notifyLeadership(base44, riskData, newStatus) {
  // Find Leadership groups for the company
  const groups = await base44.asServiceRole.entities.StakeholderGroup.filter({
    company_id: riskData.company_id,
    name: "Leadership"
  });
  if (!groups.length) return;

  const leadershipGroupId = groups[0].id;
  const leaders = await base44.asServiceRole.entities.Stakeholder.filter({
    company_id: riskData.company_id,
    status: "active"
  });

  const leadershipMembers = leaders.filter(s => s.group_ids?.includes(leadershipGroupId));

  for (const leader of leadershipMembers) {
    if (leader.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: leader.email,
        subject: `Risk Pending Your Review: ${riskData.title}`,
        body: `Hello ${leader.full_name},\n\nA risk has been assigned an owner and is now pending Leadership review:\n\nRisk: ${riskData.title}\nCategory: ${riskData.category}\nOwner: ${riskData.owner || "Assigned"}\nStatus: Pending Review\n\nPlease log in to review and sign off on this risk.\n\nThank you.`
      });
    }
  }
}