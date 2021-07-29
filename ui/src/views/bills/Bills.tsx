import React from "react";
import TabularView from "components/TabularScreen";
import { useBills } from "hooks/bills";

/**
 * function that is passed in the TableBills component
 * which retrieves bills data through the useBills hook.
 * See "hooks/bills" for more details
 */
const useBillsData = () => useBills({});

/** Table view for bills */
const TableBills: React.FC = () => {
  return (
    <TabularView
      title="Bills"
      useData={useBillsData}
      fields={[
        { label: "Provider", getter: (o) => o.bill?.payload?.provider },
        { label: "Amount", getter: (o) => o?.bill?.payload?.amount },
        {
          label: "Procedure Code",
          getter: (o) => o?.bill?.payload?.encounterDetails.procedureCode,
        },
        { label: "Paid", getter: (o) => (o?.receipt?.payload ? "Yes" : "No") },
      ]}
      tableKey={(o) => o?.bill?.contractId}
      itemUrl={(o) => o?.bill?.contractId}
    />
  );
};

export default TableBills;
