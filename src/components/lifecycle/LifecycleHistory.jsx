import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export default function LifecycleHistory({ history = [] }) {
  const getStatusBadgeColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      identified: 'bg-blue-100 text-blue-700',
      pending_review: 'bg-amber-100 text-amber-700',
      returned: 'bg-orange-100 text-orange-700',
      approved: 'bg-green-100 text-green-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      assessed: 'bg-blue-100 text-blue-700',
      mitigated: 'bg-green-100 text-green-700',
      accepted: 'bg-purple-100 text-purple-700',
      closed: 'bg-slate-100 text-slate-700',
      archived: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Lifecycle History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {history && history.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {history.map((event, idx) => (
              <div key={idx} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusBadgeColor(event.status)}`}>
                    <History className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 capitalize">
                        {event.status?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">By: {event.actor}</p>
                    {event.comments && (
                      <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-50 rounded">{event.comments}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No lifecycle history yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}