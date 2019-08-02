/**
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.digitalasset.refapps.healthcareclaims;

import static junit.framework.TestCase.assertEquals;
import static org.junit.Assert.assertNotEquals;

import com.daml.ledger.javaapi.data.Party;
import com.digitalasset.nanobot.healthcare.models.main.appointment.Appointment;
import com.digitalasset.nanobot.healthcare.models.main.claim.Claim;
import com.digitalasset.nanobot.healthcare.models.main.claim.PatientObligation;
import com.digitalasset.nanobot.healthcare.models.main.claim.PaymentReceipt;
import com.digitalasset.nanobot.healthcare.models.main.policy.DisclosedPolicy;
import com.digitalasset.nanobot.healthcare.models.main.policy.InsurancePolicy;
import com.digitalasset.nanobot.healthcare.models.main.provider.Provider;
import com.digitalasset.nanobot.healthcare.models.main.provider.ReferralDetails;
import com.digitalasset.nanobot.healthcare.models.main.referral.Referral;
import com.digitalasset.nanobot.healthcare.models.main.treatment.Treatment;
import com.digitalasset.nanobot.healthcare.models.main.types.DiagnosisCode;
import com.digitalasset.nanobot.healthcare.models.main.types.ProcedureCode;
import com.digitalasset.testing.junit4.Sandbox;
import com.digitalasset.testing.utils.ContractWithId;
import io.grpc.StatusRuntimeException;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.*;
import org.junit.rules.ExternalResource;

public class HealthcareClaimsProcessingIT {
  private static final Path RELATIVE_DAR_PATH =
      Paths.get("./target/healthcare-claims-processing.dar");
  private static final Integer sandboxPort = 6865;
  private static final int WAIT_TIMEOUT = 20;
  private static final String TEST_MODULE = "DemoOnboardScenario.InsurancePolicies";
  private static final String TEST_SCENARIO = "insurancePoliciesSetSingle";

  private static Party PROVIDER_PARTY = new Party("PrimaryCareProvider");
  private static Party RADIOLOGIST_PARTY = new Party("Radiologist");
  private static Party INSURANCE_COMPANY_PARTY = new Party("InsuranceCompany");
  private static Party PATIENT_PARTY = new Party("Patient1");

  private static Sandbox sandboxC =
      Sandbox.builder()
          .dar(RELATIVE_DAR_PATH)
          .projectDir(Paths.get("."))
          .module(TEST_MODULE)
          .scenario(TEST_SCENARIO)
          .parties(
              PROVIDER_PARTY.getValue(), RADIOLOGIST_PARTY.getValue(),
              INSURANCE_COMPANY_PARTY.getValue(), PATIENT_PARTY.getValue())
          .setupAppCallback(Main::runBots)
          .build();

  @ClassRule public static ExternalResource compile = sandboxC.compilation();
  @Rule public Sandbox.Process sandbox = sandboxC.process();

  @Test
  public void testHealthcareClaimsProcessingMainWorkflow() throws IOException {
    // Get policy and role contract to start the workflow.
    DisclosedPolicy.ContractId policy =
        sandbox.getCreatedContractId(
            PROVIDER_PARTY, DisclosedPolicy.TEMPLATE_ID, DisclosedPolicy.ContractId::new);
    Provider.ContractId provider =
        sandbox.getCreatedContractId(
            PROVIDER_PARTY, Provider.TEMPLATE_ID, Provider.ContractId::new);

    // Create a referral for PREVENTATIVE CARE, PAIN IN RIGHT ARM.
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            PROVIDER_PARTY,
            provider.exerciseCreateReferral(
                RADIOLOGIST_PARTY.getValue(),
                policy,
                "1",
                ProcedureCode.PREVENTATIVE_CARE,
                DiagnosisCode.PAIN_IN_RIGHT_ARM_M79_601,
                "11",
                "Elective"));

    // Observe the Contract ID of it
    Referral.ContractId referral =
        sandbox.getCreatedContractId(
            PROVIDER_PARTY, Referral.TEMPLATE_ID, Referral.ContractId::new);

    // Get the created referral details contract (First not yet observed referral details contract
    // Then its updated version (with some fields modified by a bot)
    ReferralDetails.ContractId initialReferralD =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);
    ReferralDetails.ContractId updatedReferralD =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);

    // The radiologist schedules an appointment for a given date
    LocalDate appointmentDate = LocalDate.of(2019, 7, 7);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            RADIOLOGIST_PARTY, updatedReferralD.exerciseScheduleAppointment(appointmentDate));

    // Check-in. It should happen on appointment date (Set time).
    sandbox
        .getLedgerAdapter()
        .setCurrentTime(Instant.ofEpochSecond(appointmentDate.toEpochDay() * 24 * 60 * 60));
    Appointment.ContractId appointment =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, Appointment.TEMPLATE_ID, Appointment.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(RADIOLOGIST_PARTY, appointment.exerciseCheckInPatient());

    // We check whether the insurance policy is there. Later, it will be updated with the completed
    // treatment.
    ContractWithId<InsurancePolicy.ContractId> insurancePolicyWithCid =
        sandbox.getMatchedContract(
            INSURANCE_COMPANY_PARTY, InsurancePolicy.TEMPLATE_ID, InsurancePolicy.ContractId::new);
    InsurancePolicy oldInsurancePolicy = InsurancePolicy.fromValue(insurancePolicyWithCid.record);

    // Complete the treatment (contract created after check-in)
    Treatment.ContractId treatment =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, Treatment.TEMPLATE_ID, Treatment.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(RADIOLOGIST_PARTY, treatment.exerciseCompleteTreatment());

    // Check the existing claim, updated insurance policy (new InsurancePolicy instance)
    Claim.ContractId claim =
        sandbox.getCreatedContractId(
            INSURANCE_COMPANY_PARTY, Claim.TEMPLATE_ID, Claim.ContractId::new);
    ContractWithId<InsurancePolicy.ContractId> newInsurancePolicyWithCid =
        sandbox.getMatchedContract(
            INSURANCE_COMPANY_PARTY, InsurancePolicy.TEMPLATE_ID, InsurancePolicy.ContractId::new);
    InsurancePolicy newInsurancePolicy =
        InsurancePolicy.fromValue(newInsurancePolicyWithCid.record);

    // Preventative care's Procedure contract changed, Sick visit's did not
    assertNotEquals(
        oldInsurancePolicy.procedureList.textMap.get("Preventative_Care"),
        newInsurancePolicy.procedureList.textMap.get("Preventative_Care"));
    assertEquals(
        oldInsurancePolicy.procedureList.textMap.get("Sick_Visits"),
        newInsurancePolicy.procedureList.textMap.get("Sick_Visits"));

    // Insurance company pays
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            INSURANCE_COMPANY_PARTY, claim.exercisePayClaim(newInsurancePolicyWithCid.contractId));

    // Obligation needs to be there, Patient pays
    PatientObligation.ContractId obligation =
        sandbox.getCreatedContractId(
            PATIENT_PARTY, PatientObligation.TEMPLATE_ID, PatientObligation.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(PATIENT_PARTY, obligation.exercisePayPatientObligation());

    // Receipt, we are done.
    PaymentReceipt.ContractId receipt =
        sandbox.getCreatedContractId(
            PATIENT_PARTY, PaymentReceipt.TEMPLATE_ID, PaymentReceipt.ContractId::new);
  }

  // Negative test case:
  // Check-in should happen on appointment date!
  @Test(expected = StatusRuntimeException.class)
  public void testHealthcareClaimsProcessingMainWorkflowWrongCheckingDate() {
    DisclosedPolicy.ContractId policy = new DisclosedPolicy.ContractId("#38:11");
    Provider.ContractId provider =
        sandbox.getCreatedContractId(
            PROVIDER_PARTY, Provider.TEMPLATE_ID, Provider.ContractId::new);

    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            PROVIDER_PARTY,
            provider.exerciseCreateReferral(
                RADIOLOGIST_PARTY.getValue(),
                policy,
                "1",
                ProcedureCode.PREVENTATIVE_CARE,
                DiagnosisCode.PAIN_IN_RIGHT_ARM_M79_601,
                "11",
                "Elective"));

    ReferralDetails.ContractId initialReferral =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);
    ReferralDetails.ContractId updatedReferral =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);

    LocalDate appointmentDate = LocalDate.of(2019, 7, 7);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            RADIOLOGIST_PARTY, updatedReferral.exerciseScheduleAppointment(appointmentDate));

    // Check-in should happen on appointment date!
    Appointment.ContractId appointment =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, Appointment.TEMPLATE_ID, Appointment.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(RADIOLOGIST_PARTY, appointment.exerciseCheckInPatient());
  }
}
