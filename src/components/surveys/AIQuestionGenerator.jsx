import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AIQuestionGenerator({ entityType, entityData, onQuestionsGenerated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateQuestions = async () => {
    setGenerating(true);
    try {
      const prompt = buildPrompt(entityType, entityData);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  type: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  required: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      const questions = result.questions.map((q, idx) => ({
        id: Date.now().toString() + idx,
        question: q.question,
        type: q.type || 'text',
        options: q.options || [],
        required: q.required || false
      }));

      onQuestionsGenerated(questions);
      setIsOpen(false);
      toast.success(`Generated ${questions.length} questions`);
    } catch (error) {
      toast.error("Failed to generate questions");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const buildPrompt = (type, data) => {
    const basePrompts = {
      ICTSystem: `Generate a comprehensive security and compliance survey for an ICT System with the following details:
Name: ${data.name}
Type: ${data.system_type}
Criticality: ${data.criticality}
Description: ${data.description || 'N/A'}

Create 12-15 questions covering:
- Security controls and measures
- Access management
- Data protection
- Business continuity and disaster recovery
- System monitoring and maintenance
- Compliance requirements
- Incident response capabilities
- Third-party integrations

Use a mix of question types: yes/no, rating (1-5), single choice, and text areas for detailed responses.`,

      ThirdPartyProvider: `Generate a comprehensive third-party risk assessment survey for a provider with these details:
Name: ${data.name}
Service Type: ${data.service_type}
Criticality: ${data.criticality}

Create 12-15 questions covering:
- Security certifications and compliance (ISO 27001, SOC 2, etc.)
- Data protection and privacy practices
- Business continuity and disaster recovery
- Incident response capabilities
- Access controls and authentication
- Subcontractor management
- Insurance and liability coverage
- Financial stability
- References and track record

Use a mix of question types: yes/no, rating (1-5), single choice, multiple choice, and text areas.`,

      Framework: `Generate a compliance readiness survey for the ${data.name} framework.

Create 12-15 questions assessing:
- Current compliance status
- Gap analysis needs
- Resource availability
- Policy and procedure documentation
- Training and awareness
- Risk assessment practices
- Monitoring and review processes
- Evidence collection capabilities

Use a mix of question types: yes/no, rating (1-5), single choice, and text areas.`
    };

    return basePrompts[type] + `

Return questions in this exact format for each question:
- question: The question text
- type: One of: "yes_no", "rating", "single_choice", "multiple_choice", "text", "textarea"
- options: Array of options (only for single_choice and multiple_choice types)
- required: true or false

Ensure questions are professional, specific, and actionable.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Generate Questions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Question Generator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            AI will analyze the {entityType.replace(/([A-Z])/g, ' $1').trim()} and generate relevant survey questions based on industry best practices.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Entity:</strong> {entityData.name}
            </p>
          </div>
          <Button 
            onClick={generateQuestions} 
            disabled={generating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Questions
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}