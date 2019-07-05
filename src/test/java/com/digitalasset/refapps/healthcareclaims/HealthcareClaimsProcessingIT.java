/**
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.digitalasset.refapps.healthcareclaims;

import com.daml.ledger.javaapi.data.Party;
import com.digitalasset.nanobot.healthcare.models.main.appointment.Appointment;
import com.digitalasset.nanobot.healthcare.models.main.claim.Claim;
import com.digitalasset.nanobot.healthcare.models.main.claim.PatientObligation;
import com.digitalasset.nanobot.healthcare.models.main.policy.DisclosedPolicy;
import com.digitalasset.nanobot.healthcare.models.main.policy.InsurancePolicy;
import com.digitalasset.nanobot.healthcare.models.main.provider.Provider;
import com.digitalasset.nanobot.healthcare.models.main.provider.ReferralDetails;
import com.digitalasset.nanobot.healthcare.models.main.treatment.Treatment;
import com.digitalasset.nanobot.healthcare.models.main.types.DiagnosisCode;
import com.digitalasset.nanobot.healthcare.models.main.types.ProcedureCode;
import com.digitalasset.testing.junit4.Sandbox;
import io.grpc.StatusRuntimeException;
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
  public void testHealthcareClaimsProcessingMainWorkflow() {
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

    // Check-in should happen on appointment date
    sandbox
        .getLedgerAdapter()
        .setCurrentTime(Instant.ofEpochSecond(appointmentDate.toEpochDay() * 24 * 60 * 60));
    Appointment.ContractId appointment =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, Appointment.TEMPLATE_ID, Appointment.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(RADIOLOGIST_PARTY, appointment.exerciseCheckInPatient());

    // We check whether the insurance policy is there. It will be updated with the completed
    // treatment.
    sandbox.getCreatedContractId(
        INSURANCE_COMPANY_PARTY, InsurancePolicy.TEMPLATE_ID, InsurancePolicy.ContractId::new);

    Treatment.ContractId treatment =
        sandbox.getCreatedContractId(
            RADIOLOGIST_PARTY, Treatment.TEMPLATE_ID, Treatment.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(RADIOLOGIST_PARTY, treatment.exerciseCompleteTreatment());

    Claim.ContractId claim =
        sandbox.getCreatedContractId(
            INSURANCE_COMPANY_PARTY, Claim.TEMPLATE_ID, Claim.ContractId::new);
    InsurancePolicy.ContractId insurancePolicy =
        sandbox.getCreatedContractId(
            INSURANCE_COMPANY_PARTY, InsurancePolicy.TEMPLATE_ID, InsurancePolicy.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(INSURANCE_COMPANY_PARTY, claim.exercisePayClaim(insurancePolicy));

    PatientObligation.ContractId obligation =
        sandbox.getCreatedContractId(
            PATIENT_PARTY, PatientObligation.TEMPLATE_ID, PatientObligation.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(PATIENT_PARTY, obligation.exercisePayPatientObligation());
  }

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
