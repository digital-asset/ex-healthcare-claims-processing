/*
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DamlLfValue } from '@da/ui-core';

export const version = {
    schema: 'navigator-config',
    major: 2,
    minor: 0
};

export function theme(userId, party, role) {
    return (party == "PrimaryCareProvider" ? { documentBackground: "#344a83" } :
           party == "Patient1" ? { documentBackground: "#4c566e" } :
           party == "Radiologist" ? { documentBackground: "Grey" } :
           party == "InsuranceCompany" ? { documentBackground: "#6f639e" } :
           { documentBackground: "#800000" });
  };

// --- Creating views --------------------------------------------------------------------

const providerActionsView = createTab("Provider Actions", ":Provider@", [
    createIdCol(),
    createCol("provider"),
    createCol("providerName", "Name"),
    createCol("profile", "profile", null, r => getObjectProp1(r.demographics.providerType)),
    createCol("providerCity", "City", null, r => r.demographics.providerCity),
]);

const referralsView = createTab("Referrals", ":ReferralDetails@", [
    createIdCol(),
    createCol("encounterId", "Encounter Id", null, r => r.referralDetails.encounterDetails.encounterId),
    createCol("referringProvider"),
    createCol("renderingProvider"),
    createCol("procedure", "Procedure", null, r => getObjectProp1(r.referralDetails.encounterDetails.procedureCode)),
    createCol("diagnosis", "Diagnosis", null, r => getObjectProp1(r.referralDetails.encounterDetails.diagnosisCode)),
]);

const appointmentsView = createTab("Appointments", ":Appointment@", [
    createIdCol(),
    createCol("encounterId", "Encounter Id", null, r => r.encounterDetails.encounterDetails.encounterId),
    createCol("provider"),
    createCol("patient"),
    createCol("procedure", "Procedure", null, r => getObjectProp1(r.encounterDetails.encounterDetails.procedureCode)),
    createCol("amount", "Total", null, r => r.encounterDetails.encounterDetails.allowedAmount),
    createCol("coPay", "Co-pay", null, r => r.encounterDetails.encounterDetails.coPay),
    createCol("patientResponsibility", "Patient Resp.", null, r => r.encounterDetails.encounterDetails.patientResponsibility),
]);

const treatmentView = createTab("Treatment", ":Treatment@", [
    createIdCol(),
    createCol("encounterId", "Encounter Id", null, r => r.encounterDetails.encounterId),
    createCol("provider"),
    createCol("patient"),
    createCol("procedure", "Procedure", null, r => getObjectProp1(r.encounterDetails.procedureCode)),
    createCol("priority", "Priority", null, r => r.encounterDetails.appointmentPriority),
    createCol("amount", "Total", null, r => r.encounterDetails.allowedAmount),
    createCol("coPay", "Co-pay", null, r => r.encounterDetails.coPay),
    createCol("patientResponsibility", "Patient Resp.", null, r => r.encounterDetails.patientResponsibility),
]);

const insurancePolicyView = createTab("Insurance Policies", ":InsurancePolicy@", [
    createIdCol(),
    createCol("payer"),
    createCol("patient"),
    createCol("policy", "Policy", null, r => getObjectProp1(r.policyType)),
    createCol("insuranceID"),
    createCol("validUntil", "Valid Until", null, r => r.policyEndDate),
    createCol("annualDeductible"),
    createCol("currentDeductible"),
]);

const disclosedPolicyView = createTab("Disclosed Policies", ":DisclosedPolicy@", [
    createIdCol(),
    createCol("payer"),
    createCol("patient"),
    createCol("receivers"),
    createCol("policy", "Policy", null, r => getObjectProp1(r.policyType)),
    createCol("insuranceID"),
    createCol("validUntil", "Valid Until", null, r => r.policyEndDate),
    createCol("annualDeductible"),
    createCol("currentDeductible"),
]);

const providerNetworkContractView = createTab("Network Contracts", ":ProviderNetworkContract@", [
    createIdCol(),
    createCol("payer"),
    createCol("provider"),
    createCol("profile", "profile", null, r => getObjectProp1(r.demographics.providerType)),
    createCol("providerCity", "City", null, r => r.demographics.providerCity),
    createCol("fee", "Fee Schedule", null, () => "Various"),
]);

const claimView = createTab("Claim", ":Claim@", [
    createIdCol(),
    createCol("encounterId", "Encounter Id", null, r => r.encounterDetails.encounterId),
    createCol("provider"),
    createCol("payer"),
    createCol("amount"),
    createCol("procedure", "Procedure", null, r => getObjectProp1(r.encounterDetails.procedureCode)),
    createCol("diagnosis", "Diagnosis", null, r => getObjectProp1(r.encounterDetails.diagnosisCode)),
]);

const patientObligationView = createTab("Patient Obligation", ":PatientObligation@", [
    createIdCol(),
    createCol("encounterId", "Encounter Id", null, r => r.encounterDetails.encounterId),
    createCol("provider"),
    createCol("amount"),
    createCol("procedure", "Procedure", null, r => getObjectProp1(r.encounterDetails.procedureCode)),
    createCol("diagnosis", "Diagnosis", null, r => getObjectProp1(r.encounterDetails.diagnosisCode)),
]);

const failedReferralView = createTab("Failed Referrals", ":FailedReferral@", [
    createIdCol(),
    createCol("patient"),
    createCol("receiver"),
    createCol("reason", null, 300),
]);

const failedCheckInView = createTab("Failed Check-Ins", ":FailedCheckIn@", [
    createIdCol(),
    createCol("patient"),
    createCol("appointmentTime"),
    createCol("reason", null, 300),
]);

const failedSchedulingAppointmentView = createTab("Failed Appointments", ":FailedSchedulingAppointment@", [
    createIdCol(),
    createCol("patient"),
    createCol("appointmentTime"),
    createCol("reason", null, 300),
]);

// --- Assigning views to parties --------------------------------------------------------------------

export const customViews = (userId, party, role) => {
    if (party == 'Radiologist') {
        return {
            providerActionsView,
            referralsView,
            appointmentsView,
            treatmentView,
            disclosedPolicyView,
            providerNetworkContractView,
            claimView,
            failedSchedulingAppointmentView,
            failedCheckInView,
        };
    }

    if (party == 'PrimaryCareProvider') {
        return {
            providerActionsView,
            referralsView,
            treatmentView,
            disclosedPolicyView,
            providerNetworkContractView,
            failedReferralView,
        };
    }

    if (party == 'Patient1') {
        return {
            appointmentsView,
            treatmentView,
            insurancePolicyView,
            disclosedPolicyView,
            patientObligationView,
        };
    }

    if (party == 'InsuranceCompany') {
        return {
            insurancePolicyView,
            disclosedPolicyView,
            providerNetworkContractView,
            claimView,
        };
    }

    return {
    };
};


// --- Helpers --------------------------------------------------------------------

/**
 title, width and proj are optional

 if proj is null and key is "id" then it will default to the contract id
 if proj is null and key is not "id" then it will default to stringified single or array value of rowData.key
*/
function createCol(key, title = toTitle(key), width = 80, proj) {
    return {
        key: key,
        title: title,
        createCell: ({ rowData }) => ({
            type: "text",
            value: valueFunction(rowData, key, proj)
        }),
        sortable: true,
        width: width,
        weight: 0,
        alignment: "left"
    };
}

function createIdCol() {
    return createCol("id", "Contract ID", 60);
}

function createTab(name, templateId, columns, additionalFilter) {
    var filter;
    if (additionalFilter == null) {
        filter =
        [
            {
                field: "template.id",
                value: templateId
            }
        ]
    } else {
        filter =
        [
            {
                field: "template.id",
                value: templateId
            },
            additionalFilter
        ]
    }
    return {
        type: "table-view",
        title: name,
        source: {
            type: "contracts",
            filter: filter,
            search: "",
            sort: [
                {
                    field: "id",
                    direction: "ASCENDING"
                }
            ]
        },
        columns: columns
    };
}


function formatIfNum(val) {
    var n = Number(val);
    if (Number.isNaN(n)) return val;
    else return n.toLocaleString();
}

function valueFunction(rowData, key, proj) {
    return (
        proj == null
        ?
        (
            Array.isArray(DamlLfValue.toJSON(rowData.argument)[key])
            ?
            DamlLfValue.toJSON(rowData.argument)[key].join(", ")
            :
            (
                key == "id"
                ?
                rowData.id
                :
                formatIfNum(DamlLfValue.toJSON(rowData.argument)[key])
            )
        )
        :
        formatIfNum(proj(DamlLfValue.toJSON(rowData.argument))));
}

// inserts spaces into the usually camel-case key
// e.g. "assetISINCode" -> "Asset ISIN Code"
function toTitle(key) {
    var spaced = key.replace(/([^A-Z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][^A-Z])/g, '$1 $2');
    return spaced[0].toUpperCase() + spaced.substr(1)
}

function getObjectProp1(o) {
    return Object.keys(o)[0];
}

