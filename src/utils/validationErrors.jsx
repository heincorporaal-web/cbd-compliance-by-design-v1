/**
 * Validation utilities for ICT Systems, Modules, Value Chains, and Workstreams
 * Returns error counts and details for missing required fields
 */

import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ICT System validation errors
export function getICTSystemErrors(system) {
  const errors = [];
  
  if (!system.owner) {
    errors.push({ type: 'no_owner', message: 'No owner' });
  }
  
  if (system.criticality === 'critical' && !system.recovery_time_objective) {
    errors.push({ type: 'no_rto_critical', message: 'Critical system missing RTO' });
  }
  
  if (system.criticality === 'critical' && !system.recovery_point_objective) {
    errors.push({ type: 'no_rpo_critical', message: 'Critical system missing RPO' });
  }
  
  return errors;
}

// ICT Module validation errors
export function getICTModuleErrors(module) {
  const errors = [];
  
  if (!module.module_owner_stakeholder_id && !module.module_owner_name) {
    errors.push({ type: 'no_owner', message: 'No owner' });
  }
  
  if (!module.workstream_id && !module.workstream_name) {
    errors.push({ type: 'no_workstream', message: 'No workstream' });
  }
  
  return errors;
}

// Value Chain validation errors
export function getValueChainErrors(vc) {
  const errors = [];
  
  if (!vc.owner && !vc.process_owner) {
    errors.push({ type: 'no_owner', message: 'No owner' });
  }
  
  return errors;
}

// Workstream validation errors
export function getWorkstreamErrors(ws) {
  const errors = [];
  
  if (!ws.owner && !ws.process_owner) {
    errors.push({ type: 'no_owner', message: 'No owner' });
  }
  
  return errors;
}

// Error icon component helper
export function ErrorIcon({ errors, className = "w-3.5 h-3.5" }) {
  if (!errors || errors.length === 0) return null;
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertTriangle className={`${className} text-red-500`} />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs bg-blue-50 border-blue-200">
          <div className="space-y-1">
            <p className="font-semibold text-blue-800">{errors.length} error{errors.length !== 1 ? 's' : ''}</p>
            <ul className="text-xs space-y-0.5">
              {errors.map((err, idx) => (
                <li key={idx} className="text-blue-700">• {err.message}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}