import React from "react";
import { useParams } from "react-router-dom";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { CalendarBlank } from "phosphor-react";
import { mapIter, leftJoin, useAsync, Message } from "./Common";
import { ChoiceModal } from "./ChoiceModal";
import {
  TabularScreenRoutes,
  TabularView,
  SingleItemView,
} from "./TabularScreen";
import { Party } from "@daml/types";

type Props = {
  role: Party;
};

const ClaimRoutes: React.FC<Props> = ({ role }) => (
  <TabularScreenRoutes
    metavar=":claimId"
    table={Claims}
    detail={Claim({ role })}
  />
);

const useClaims = (query: any) => {
  const ledger = useLedger();
  const claim = useAsync(
    async () =>
      query.claimId
        ? await ledger.fetch(Main.Claim.Claim, query.claimId)
        : null,
    query
  );
  const claimsStream = useStreamQueries(Main.Claim.Claim, () => [
    query,
  ]).contracts;
  const claims: readonly CreateEvent<Main.Claim.Claim>[] =
    query.claimId && claim ? [claim] : claimsStream;
  const claimIds = claims.map((claim) => ({
    paymentId: claim.payload.claimId,
  }));
  const receipts = useStreamQueries(
    Main.Claim.PaymentReceipt,
    () => claimIds
  ).contracts;

  const keyedClaims = new Map(
    claims.map((claim) => [claim.payload.claimId, claim])
  );
  const keyedReceipts = new Map(
    receipts.map((receipt) => [receipt.payload.paymentId, receipt])
  );

  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  const keyedDisclosed = new Map(disclosed.map((p) => [p.payload.patient, p]));

  return Array.from(
    mapIter(
      ([claim, receipt]) => ({
        claim,
        receipt,
        disclosed: keyedDisclosed.get(claim.payload.encounterDetails.patient),
      }),
      leftJoin(keyedClaims, keyedReceipts).values()
    )
  );
};

const useClaimsData = () => useClaims({});

const Claims: React.FC = () => {
  return (
    <TabularView
      title="Claims"
      useData={useClaimsData}
      fields={[
        // NB: outputs provider role (e.g. "Radiologist") instead of provider name (e.g. "Beta Imaging Labs")
        { label: "Provider", getter: (o) => o?.claim?.payload?.provider },
        {
          label: "Patient",
          getter: (o) => o?.claim?.payload?.encounterDetails?.patient,
        },
        {
          label: "Procedure Code",
          getter: (o) => o?.claim?.payload?.encounterDetails.procedureCode,
        },
        { label: "Amount", getter: (o) => o?.claim?.payload?.amount },
      ]}
      tableKey={(o) => o.claim.contractId}
      itemUrl={(o) => o.claim.contractId}
    />
  );
};

const useClaimData = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const overview = useClaims({ claimId })[0];
  return [{ claimId, overview: overview }];
};

const Claim: React.FC<Props> = ({ role }) => {
  const dollars = (n: any) => (n ? "$" + n : "");
  return (
    <SingleItemView
      title="Claim"
      useData={useClaimData}
      fields={[
        [
          {
            label: "Allowed Amount",
            getter: (o) =>
              dollars(
                o?.overview?.claim?.payload?.encounterDetails?.allowedAmount
              ),
          },
          {
            label: "CoPay",
            getter: (o) =>
              dollars(o?.overview?.claim?.payload?.encounterDetails?.coPay),
          },
          {
            label: "Patient Responsibility",
            getter: (o) =>
              dollars(
                o?.overview?.claim?.payload?.encounterDetails
                  ?.patientResponsibility
              ),
          },
          {
            label: "Claim Amount",
            getter: (o) => dollars(o?.overview?.claim?.payload?.amount),
          },
        ],
        [
          {
            label: "Procedure Code",
            getter: (o) =>
              o?.overview?.claim?.payload?.encounterDetails.procedureCode,
          },
          {
            label: "Diagnosis Code",
            getter: (o) =>
              o?.overview?.claim?.payload?.encounterDetails.diagnosisCode,
          },
          {
            label: "Site Service Code",
            getter: (o) =>
              o?.overview?.claim?.payload?.encounterDetails.siteServiceCode,
          },
        ],
        [
          // NB: outputs provider role (e.g. "Radiologist") instead of provider name (e.g. "Beta Imaging Labs")
          {
            label: "Provider",
            getter: (o) => o?.overview?.claim?.payload?.provider,
          },
          {
            label: "Patient",
            getter: (o) =>
              o?.overview?.claim?.payload?.encounterDetails?.patient,
          },
          {
            label: "Appointment Priority",
            getter: (o) =>
              o?.overview?.claim?.payload?.encounterDetails.appointmentPriority,
          },
        ],
      ]}
      tableKey={(o) => o.overview?.claim?.contractId}
      itemUrl={(o) => ""}
      choices={(d) =>
        d.overview?.claim?.payload?.payer === role ? (
          <ChoiceModal
            className="flex flex-col space-y-6 w-170 mt-3"
            choice={Main.Claim.Claim.PayClaim}
            contract={d.overview?.claim?.contractId}
            submitTitle="Pay Claim Now"
            buttonTitle="Pay Claim"
            icon={<CalendarBlank size={20} />}
            initialValues={{}}
          >
            <Message
              title="Pay Claim"
              content={`This claim is approved and ready to be paid?`}
            />
          </ChoiceModal>
        ) : (
          <></>
        )
      }
    />
  );
};

export default ClaimRoutes;
