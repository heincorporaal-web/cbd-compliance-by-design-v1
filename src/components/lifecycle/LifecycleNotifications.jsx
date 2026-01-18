import React from "react";
import { AlertCircle, CheckCheck } from "lucide-react";

export default function LifecycleNotifications({ entity }) {
  return (
    <>
      {entity?.return_comments && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900">Returned for Revision</p>
              <p className="text-sm text-orange-700 mt-1">{entity.return_comments}</p>
            </div>
          </div>
        </div>
      )}

      {entity?.approver && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCheck className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Approved by {entity.approver}</p>
              <p className="text-sm text-green-700 mt-1">
                {new Date(entity.approval_date).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}