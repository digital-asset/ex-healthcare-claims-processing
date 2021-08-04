import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, useAsync, leftJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";

type paymentIdsProps = {
  paymentId: string;
};
// hook to stream receipt data matching paymentIds
const useKeyedReceipts = (paymentIds: paymentIdsProps[]) => {
  const receipts = useStreamQueries(
    Main.Claim.PaymentReceipt,
    () => paymentIds
  ).contracts;

  const keyedReceipts = new Map(
    receipts.map((receipt) => [receipt.payload.paymentId, receipt])
  );

  return keyedReceipts;
};

//Hook to fetch and stream bill data from Daml ledger
export const useBills = (query: any) => {
  // Stream all claim data
  const billsStream = useStreamQueries(Main.Claim.PatientObligation, () => [
    query,
  ]).contracts;

  const bills: readonly CreateEvent<Main.Claim.PatientObligation>[] =
    billsStream;

  const paymentIds: paymentIdsProps[] = bills.map((bill) => ({
    paymentId: bill.payload.paymentId,
  }));

  // Create new map for bills and receicept, used to combine data
  const keyedBills = new Map(
    bills.map((bill) => [bill.payload.paymentId, bill])
  );

  const keyedReceipts = useKeyedReceipts(paymentIds);

  //return a combined array of bills and receipts
  return Array.from(
    mapIter(
      ([bill, receipt]) => ({ bill, receipt }),
      leftJoin(keyedBills, keyedReceipts).values()
    )
  );
};

//Hook to fetch a single bill
export const useBill = (query: any) => {
  const ledger = useLedger();

  // Fetch single claim information
  const billFetch = useAsync(
    async () => await ledger.fetch(Main.Claim.PatientObligation, query.billId),
    query
  );

  const bills: readonly CreateEvent<Main.Claim.PatientObligation>[] = billFetch
    ? [billFetch]
    : [];

  const paymentIds: paymentIdsProps[] = bills.map((bill) => ({
    paymentId: bill.payload.paymentId,
  }));

  const keyedBills = new Map(
    bills.map((bill) => [bill.payload.paymentId, bill])
  );
  const keyedReceipts = useKeyedReceipts(paymentIds);

  //return a combined array of bill and receipt
  return Array.from(
    mapIter(
      ([bill, receipt]) => ({ bill, receipt }),
      leftJoin(keyedBills, keyedReceipts).values()
    )
  );
};
