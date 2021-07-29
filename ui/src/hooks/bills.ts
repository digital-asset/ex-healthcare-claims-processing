import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, useAsync, leftJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";

/**
 * Hook to fetch and stream bill data from Daml ledger
 */
export const useBills = (query: any) => {
  const ledger = useLedger();
  /** Fetch single bill information if the query contains a "billId" */
  const bill = useAsync(
    async () =>
      query.billId
        ? await ledger.fetch(Main.Claim.PatientObligation, query.billId)
        : null,
    query
  );

  /** Stream all bill data which is within the authorized scope of the party */
  const billsStream = useStreamQueries(Main.Claim.PatientObligation, () => [
    query,
  ]).contracts;

  /**
   * Call CreateEvent on bill or billsStream to fetch just the created data
   * For further explanation, see: https://docs.daml.com/1.2.0-snapshot.20200602.4310.0.1c18058f/app-dev/bindings-ts/daml-ledger/index.html#codestreamquerycode
   */
  const bills: readonly CreateEvent<Main.Claim.PatientObligation>[] =
    query.billId && bill ? [bill] : billsStream;

  /** Create array of payment ids to fetch receipts */
  const paymentIds = bills.map((bill) => ({
    paymentId: bill.payload.paymentId,
  }));

  /** Stream all receipt data within the authorized scope of the party and has a matching id with list of paymentIds  */
  const receipts = useStreamQueries(
    Main.Claim.PaymentReceipt,
    () => paymentIds
  ).contracts;

  /** Create new bill map to combine the bills and receipts  */
  const keyedBills = new Map(
    bills.map((bill) => [bill.payload.paymentId, bill])
  );

  /** Create new receipt map to combine the bills and receipts  */
  const keyedReceipts = new Map(
    receipts.map((receipt) => [receipt.payload.paymentId, receipt])
  );

  /** Return the combined fetched data */
  return Array.from(
    mapIter(
      ([bill, receipt]) => ({ bill, receipt }),
      leftJoin(keyedBills, keyedReceipts).values()
    )
  );
};
