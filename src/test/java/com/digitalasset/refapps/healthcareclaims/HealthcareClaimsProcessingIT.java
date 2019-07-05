package com.digitalasset.refapps.healthcareclaims;

import com.daml.ledger.javaapi.data.Party;
import com.daml.ledger.javaapi.data.Text;
import com.daml.ledger.javaapi.data.Unit;
import com.daml.ledger.javaapi.data.Variant;
import com.digitalasset.nanobot.healthcare.models.main.appointment.Appointment;
import com.digitalasset.nanobot.healthcare.models.main.claim.Claim;
import com.digitalasset.nanobot.healthcare.models.main.claim.PatientObligation;
import com.digitalasset.nanobot.healthcare.models.main.policy.DisclosedPolicy;
import com.digitalasset.nanobot.healthcare.models.main.policy.InsurancePolicy;
import com.digitalasset.nanobot.healthcare.models.main.provider.Provider;
import com.digitalasset.nanobot.healthcare.models.main.provider.ReferralDetails;
import com.digitalasset.nanobot.healthcare.models.main.provider.ScheduleAppointment;
import com.digitalasset.nanobot.healthcare.models.main.referral.Referral;
import com.digitalasset.nanobot.healthcare.models.main.treatment.Treatment;
import com.digitalasset.nanobot.healthcare.models.main.types.DiagnosisCode;
import com.digitalasset.nanobot.healthcare.models.main.types.ProcedureCode;
import com.digitalasset.testing.ledger.DefaultLedgerAdapter;
import com.digitalasset.testing.ledger.SandboxRunner;
import com.digitalasset.testing.ledger.clock.SandboxTimeProviderFactory$;
import com.digitalasset.testing.store.DefaultValueStore;
import io.grpc.StatusRuntimeException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import scala.concurrent.duration.FiniteDuration;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static com.digitalasset.testing.Dsl.getCreatedContractId;

public class HealthcareClaimsProcessingIT {
    private static final String RELATIVE_DAR_PATH = "./target/healthcare-claims-processing.dar";
    private static final Integer sandboxPort = 6865;
    private static final int WAIT_TIMEOUT = 20;
    private static final String TEST_MODULE = "DemoOnboardScenario.InsurancePolicies";
    private static final String TEST_SCENARIO = "insurancePoliciesSetSingle";

    private DefaultLedgerAdapter lA;
    private SandboxRunner sbRunner;

    private Party PROVIDER_PARTY = new Party("PrimaryCareProvider");
    private Party RADIOLOGIST_PARTY = new Party("Radiologist");
    private Party INSURANCE_COMPANY_PARTY = new Party("InsuranceCompany");
    private Party PATIENT_PARTY = new Party("Patient1");

    @Before
    public void before() throws IOException, InterruptedException {
        lA = new DefaultLedgerAdapter(new DefaultValueStore(), SandboxTimeProviderFactory$.MODULE$,
                "localhost", sandboxPort, FiniteDuration.apply(5, TimeUnit.SECONDS));
        sbRunner = new SandboxRunner(RELATIVE_DAR_PATH, TEST_MODULE, TEST_SCENARIO, sandboxPort, WAIT_TIMEOUT, new Runnable() {
            @Override
            public void run() {
                try {
                    Main.main(new String[]{"-p", Integer.toString(sandboxPort)});
                } catch (Throwable e) {
                    e.printStackTrace();
                }
            }
        });
        sbRunner.startSandboxWithBots();
        lA.start(new String[]{PROVIDER_PARTY.getValue(), RADIOLOGIST_PARTY.getValue(),
                              INSURANCE_COMPANY_PARTY.getValue(), PATIENT_PARTY.getValue()});
    }

    @After
    public void after() {
        lA.stop();
        sbRunner.stopSandboxAndBots();
    }

    @Test
    public void testHealthcareClaimsProcessingMainWorkflow() {
        DisclosedPolicy.ContractId policy = new DisclosedPolicy.ContractId("#38:11");
        Provider.ContractId provider = getCreatedContractId(lA, PROVIDER_PARTY, Provider.TEMPLATE_ID, Provider.ContractId::new);

        lA.exerciseChoice(PROVIDER_PARTY,
                          provider.exerciseCreateReferral(
                                  RADIOLOGIST_PARTY.getValue(),
                                  policy,
                                  "1",
                                  ProcedureCode.fromValue(new Variant("Preventative_Care", Unit.getInstance())),
                                  DiagnosisCode.fromValue(new Variant("Pain_in_right_arm_M79_601", Unit.getInstance())),
                                  "11",
                                  "Elective"));

        ReferralDetails.ContractId initialReferral =
                getCreatedContractId(lA, RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);
        ReferralDetails.ContractId updatedReferral =
                getCreatedContractId(lA, RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);

        LocalDate appointmentDate = LocalDate.of(2019, 7,7);
        lA.exerciseChoice(RADIOLOGIST_PARTY, updatedReferral.exerciseScheduleAppointment(appointmentDate));

        // Check-in should happen on appointment date
        lA.setCurrentTime(Instant.ofEpochSecond(appointmentDate.toEpochSecond(LocalTime.MIDNIGHT, ZoneOffset.UTC)));
        Appointment.ContractId appointment =
                getCreatedContractId(lA, RADIOLOGIST_PARTY, Appointment.TEMPLATE_ID, Appointment.ContractId::new);
        lA.exerciseChoice(RADIOLOGIST_PARTY, appointment.exerciseCheckInPatient());

        // We check wether the insurance policy is there. It will be updated with the completed treatment.
        getCreatedContractId(lA, INSURANCE_COMPANY_PARTY, InsurancePolicy.TEMPLATE_ID, InsurancePolicy.ContractId::new);

        Treatment.ContractId treatment =
                getCreatedContractId(lA, RADIOLOGIST_PARTY, Treatment.TEMPLATE_ID, Treatment.ContractId::new);
        lA.exerciseChoice(RADIOLOGIST_PARTY, treatment.exerciseCompleteTreatment());

        Claim.ContractId claim =
                getCreatedContractId(lA, INSURANCE_COMPANY_PARTY, Claim.TEMPLATE_ID, Claim.ContractId::new);
        InsurancePolicy.ContractId insurancePolicy =
                getCreatedContractId(lA, INSURANCE_COMPANY_PARTY, InsurancePolicy.TEMPLATE_ID, InsurancePolicy.ContractId::new);
        lA.exerciseChoice(INSURANCE_COMPANY_PARTY, claim.exercisePayClaim(insurancePolicy));

        PatientObligation.ContractId obligation = getCreatedContractId(lA, PATIENT_PARTY, PatientObligation.TEMPLATE_ID, PatientObligation.ContractId::new);
        lA.exerciseChoice(PATIENT_PARTY, obligation.exercisePayPatientObligation());
    }

    @Test(expected = StatusRuntimeException.class)
    public void testHealthcareClaimsProcessingMainWorkflowWrongCheckinDate() {
        DisclosedPolicy.ContractId policy = new DisclosedPolicy.ContractId("#38:11");
        Provider.ContractId provider = getCreatedContractId(lA, PROVIDER_PARTY, Provider.TEMPLATE_ID, Provider.ContractId::new);

        lA.exerciseChoice(PROVIDER_PARTY,
                provider.exerciseCreateReferral(
                        RADIOLOGIST_PARTY.getValue(),
                        policy,
                        "1",
                        ProcedureCode.fromValue(new Variant("Preventative_Care", Unit.getInstance())),
                        DiagnosisCode.fromValue(new Variant("Pain_in_right_arm_M79_601", Unit.getInstance())),
                        "11",
                        "Elective"));

        ReferralDetails.ContractId initialReferral =
                getCreatedContractId(lA, RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);
        ReferralDetails.ContractId updatedReferral =
                getCreatedContractId(lA, RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);

        LocalDate appointmentDate = LocalDate.of(2019, 7,7);
        lA.exerciseChoice(RADIOLOGIST_PARTY, updatedReferral.exerciseScheduleAppointment(appointmentDate));

        // Check-in should happen on appointment date!
        Appointment.ContractId appointment =
                getCreatedContractId(lA, RADIOLOGIST_PARTY, Appointment.TEMPLATE_ID, Appointment.ContractId::new);
        lA.exerciseChoice(RADIOLOGIST_PARTY, appointment.exerciseCheckInPatient());
    }
}
