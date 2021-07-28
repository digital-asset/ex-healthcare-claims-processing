import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, useAsync, leftJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";

export const useBills = (query: any) => {
  const ledger = useLedger();
  const bill = useAsync(
    async () =>
      query.billId
        ? await ledger.fetch(Main.Claim.PatientObligation, query.billId)
        : null,
    query
  );
  const billsStream = useStreamQueries(Main.Claim.PatientObligation, () => [
    query,
  ]).contracts;
  const bills: readonly CreateEvent<Main.Claim.PatientObligation>[] =
    query.billId && bill ? [bill] : billsStream;
  const paymentIds = bills.map((bill) => ({
    paymentId: bill.payload.paymentId,
  }));
  const receipts = useStreamQueries(
    Main.Claim.PaymentReceipt,
    () => paymentIds
  ).contracts;

  const keyedBills = new Map(
    bills.map((bill) => [bill.payload.paymentId, bill])
  );
  const keyedReceipts = new Map(
    receipts.map((receipt) => [receipt.payload.paymentId, receipt])
  );

  return Array.from(
    mapIter(
      ([bill, receipt]) => ({ bill, receipt }),
      leftJoin(keyedBills, keyedReceipts).values()
    )
  );
};
