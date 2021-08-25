import Profile from "../views/Profile";

import Patient from "../views/patients/Patient";
import Patients from "../views/patients/Patients";

import Referral from "../views/referrals/Referral";
import Referrals from "../views/referrals/Referrals";

import Bill from "../views/bills/Bill";
import Bills from "../views/bills/Bills";

import Appointment from "../views/appointments/Appointment";
import Appointments from "../views/appointments/Appointments";

import Treatment from "../views/treatments/Treatment";
import Treatments from "../views/treatments/Treatments";

import Claim from "../views/claims/Claim";
import Claims from "../views/claims/Claims";

/**
 * Configs for all main routes
 * Note: some routes might have more children routes nested. e.g. patients
 * */

export const routes = [
  //general entry route
  {
    to: "/",
    exact: true,
    roles: ["Patient1", "PrimaryCareProvider", "Radiologist"],
    view: Profile,
  },

  //patient routes
  {
    to: "/provider/patients",
    roles: ["PrimaryCareProvider", "Radiologist"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: Patients,
      },
      {
        to: "/:patientId",
        exact: false,
        view: Patient,
      },
    ],
  },

  //referral routes
  {
    to: "/provider/referrals",
    roles: ["PrimaryCareProvider", "Radiologist"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: Referrals,
      },
      {
        to: "/:referralId",
        exact: true,
        view: Referral,
      },
    ],
  },

  // treatment routes
  {
    to: "/provider/treatments",
    roles: ["Patient1", "Radiologist"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: Treatments,
      },
      {
        to: "/:treatmentId",
        exact: true,
        view: Treatment,
      },
    ],
  },

  // bill routes
  {
    to: "/patient/bills",
    roles: ["Patient1"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: Bills,
      },
      {
        to: "/:billId",
        exact: true,
        view: Bill,
      },
    ],
  },

  // claim routes
  {
    to: "/provider/claims",
    roles: ["Radiologist", "InsuranceCompany"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: Claims,
      },
      {
        to: "/:claimId",
        exact: true,
        view: Claim,
      },
    ],
  },

  // appointment routes
  {
    to: "/provider/appointments",
    roles: ["Radiologist", "Patient1"],
    childRoutes: [
      {
        to: "/",
        exact: true,
        view: Appointments,
      },
      {
        to: "/:appointmentId",
        exact: true,
        view: Appointment,
      },
    ],
  },
];
