import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function FrameworkAssignmentTab({ companyId, existingAssignments = [], frameworks = [], onAssignmentsChange }) {
  const [assignments, setAssignments] = useState(
    existingAssignments?.map(a => ({
      ...a,
      assigned_date: a.assigned_date || format(new Date(), 'yyyy-MM-dd')
    })) || []
  );

  const addAssignment = () => {
    setAssignments([
      ...assignments,
      {
        framework_id: "",
        framework_name: "",
        justification: "",
        assigned_date: format(new Date(), 'yyyy-MM-dd')
      }
    ]);
  };

  const updateAssignment = (index, field, value) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate framework name when framework_id changes
    if (field === 'framework_id') {
      const framework = frameworks.find(f => f.id === value);
      if (framework) {
        updated[index].framework_name = framework.name;
      }
    }
    
    setAssignments(updated);
  };

  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  // Notify parent of changes
  useEffect(() => {
    if (onAssignmentsChange) {
      onAssignmentsChange(assignments);
    }
  }, [assignments, onAssignmentsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <p className="text-sm text-slate-600">Assign frameworks and document why they apply to this company</p>
        </div>
        <Button type="button" onClick={addAssignment} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Framework
        </Button>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((assignment, idx) => (
            <Card key={idx} className="p-4 border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">Framework #{idx + 1}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeAssignment(idx)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`framework-${idx}`}>Framework *</Label>
                    <Select
                      value={assignment.framework_id}
                      onValueChange={(value) => updateAssignment(idx, 'framework_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworks.map(fw => (
                          <SelectItem key={fw.id} value={fw.id}>
                            {fw.name} ({fw.framework_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assignment.framework_name && (
                      <p className="text-xs text-slate-500">Selected: {assignment.framework_name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`date-${idx}`}>Assigned Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{assignment.assigned_date}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`justification-${idx}`}>Justification *</Label>
                  <Textarea
                    id={`justification-${idx}`}
                    placeholder="Explain why this framework is applied to this company (e.g., regulatory requirement, industry standard, customer requirement)"
                    value={assignment.justification}
                    onChange={(e) => updateAssignment(idx, 'justification', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    Document the business or regulatory reason for applying this framework
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No frameworks assigned yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add Framework" to assign frameworks to this company</p>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            {assignments.length} Framework{assignments.length !== 1 ? 's' : ''} Assigned
          </Badge>
          <span className="text-sm text-blue-800">
            {assignments.filter(a => a.justification).length} with justification{assignments.filter(a => a.justification).length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}