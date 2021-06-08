# Reference Application: Healthcare Claims Processing

## Overview

This application simulates processing a healthcare claim, starting with the referral from the Primary Care Provider (PCP) and including the creation of an appointment with the radiologist, checking in the patient on the date of the appointment, checking out the patient after service delivery, generation of the claim, and finally, payment for the procedure.

## Getting Started

### Installing

**Disclaimer:** This reference application is intended to demonstrate the capabilities of Daml. You are recommended to consider other non-functional aspects, like security, resiliency, recoverability, etc prior to production use.

#### Prerequisites

Be sure you have the following installed.
- [Daml SDK](https://docs.daml.com/)
- Java 8 or higher
- Make
- Node v14.16.0 or higher
- NPM v7.14.0 or higher
- [Python Pipenv](https://pipenv.pypa.io/)

### Starting the App

1. Build the App. Type:
    ```shell
    make build
    ```
    **Note:** If you change the Daml models locally, you need to re-run this command before starting the application.

2. Use **separate terminals** to launch the individual components:

    ```shell
    launchers/sandbox+populate
    launchers/automation
    launchers/ui
    ```

### Stopping the App

1. Stop each running command by pressing **Ctrl+C**.

## User Guide

This User Guide will take you step-by-step through healthcare claims processing, executing one successful claim.

**Note:** This demo is designed to show successful processing of a claim without exceptions or error conditions. A full production implementation would include additional features, handle errors and exceptions, and incorporate appropriate security controls.


## Workflow

**Roles and Responsibilities**


<table>
<thead>
  <tr>
    <th>Role</th>
    <th>Responsibility</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>Primary Care Provider</td>
    <td>A physician, who creates a referral for a Patient to a Radiologist</td>
  </tr>
  <tr>
    <td>Patient</td>
    <td>Visits the Primary Care Provider and is referred to a Radiologist<br>Pays their portion of the Bill/Claim after the Radiologist submits a Claim</td>
  </tr>
  <tr>
    <td>Radiologist</td>
    <td>Checks Referrals and schedules an Appointment for a Patient<br>On the Appointment date they Check-In the Patient in and perform a treatment <br>Marks the Treatment as Completed which creates a Claim for the Insurance Company</td>
  </tr>
  <tr>
    <td>Insurance Company</td>
    <td>Pays their portion of the Claim/Bill after the Radiologist submits a Claim</td>
  </tr>
</tbody>
</table>


**Steps**

The Healthcare Process workflow involves these steps:



1. **Referral**

    The Primary Care Provider creates a referral for "John Doe" in the system, sending the patient to a radiology lab (Radiologist) for an x-ray of a possible fracture. The system checks to verify that the patient is eligible for treatment under their insurance and calculates the cost of the procedure for this patient.


    Checks include:

    *   Validity of the patient’s insurance policy (in good standing, not expired)
    *   Network status of the radiologist (whether in or out of the insurance company’s approved provider list)
    *   Verification of eligibility and pre-authorization for the treatment

2. **Appointment**

    The Radiologist now creates an appointment for the patient in the system. The system ensures that the treatment is appropriate for the diagnosis and that any necessary pre-authorization has been done. It checks again to ensure that the patient insurance status has not changed since the referral was created.

3. **Check-In**

    The patient goes to the lab and is checked in. Again the system reruns all the previous checks to determine if any parameter has changed, for example, whether the patient has satisfied more of their deductible before this date.

4. **Treatment Completion and Claim Creation**

    The x-ray is done. The treatment is completed, and the claim is automatically created. The system creates an obligation for the patient to pay their portion of the cost (if any) and for the insurance company to pay its portion.

5. **Payment**

    The insurance company now pays the claim to the lab. The patient pays any required amount as well. The amounts paid are the verified amount established in first steps of the process.



## Running the Application


### Choosing and Changing Roles

When you launch the application, you will see a login screen with the option to choose your Role.

To switch from one Role to another click on "Change Roles" in the lower left hand corner of the screen.

Note: In this application each Role is represented by a different Party, this is a simplified design for demonstration purposes.


## Refer the Patient ("John Doe") to the Radiologist

The workflow begins with the patient visiting their Primary Care Provider physician (PCP) for treatment. The PCP decides the patient needs an X-Ray and creates a referral to a Radiologist.

### Create a Referral

1. Log in as the Primary Care Provider Role
1. Go to **Patients** tab
1. Click on the Patient "John Doe"
1. Select "Refer Patient"
1. Fill out the "Create Referral" screen and click "Create Referral.
    * You can select the "Policy", "Diagnosis Code", and "Procedure Code" from their respective dropdowns
    * Receiver must be "Radiologist" (without quotes)
    * All other fields can contain any text


## Schedule an Appointment for the Patient as the Radiologist

The next step is scheduling the appointment for the x-ray.

### Schedule the Patient


1. Log in as the Radiologist
1. Choose the **Referrals** tab
1. Click on the referral for "John Doe" that you just created
4. Choose **Schedule Appointment**
5. Select the date and time for the appointment on the New Appointment pane and click the **Schedule Appointment** button.
    * You'll typically want to leave this as the current date and time, otherwise the system won't let you check in "John Doe" until the scheduled appointment time has passed.
    * This new appointment is now visible to the Radiologist and "John Doe".

    * The various checks are run again, and the payment requirements are displayed, showing now what payment the lab will receive and what the patient will owe.
    
    * The Primary Care Provider cannot see this part of the workflow, as the appointment scheduling is only disclosed to the Patient, the Radiologist, and the Insurance Company.

## Check-In the Patient as the Radiologist

The next step is for the patient to arrive at the lab for the x-ray and be checked in.

### Check-In

1. Choose the **Appointments** tab as the Radiologist
1. Click on "John Doe"s appointment
1. Click "Check In Patient" and confirm in the dialog window

    The various checks are run again to confirm that the patient is still eligible and to recalculate the payments to account for any changes, such as a situation where the patient has satisfied part of their deductible.


## Complete Treatment and Create the Claim as the Radiologist

After the x-ray is done, the patient is checked out from the facility, and the claim is created.

### Complete Treatment

1. Choose the **Treatments** tab as the Radiologist
1. On the Treatments tab, click on the treatment with "John Doe"s name and click **Complete Treatment** and confirm in the dialog window
    * You can see the pending unpaid claim by locating it on the Claims tab. It will show both the Patient and Insurance Company's payment responsibilities.


## Make Payments from Insurance Company and Patient

The last step of this workflow is for payment to be made to the lab by both the Insurance Company and the Patient

### Make Payment

1. Log in as Insurance Company and choose the **Claims** tab
1. On the Claims list screen, click on the claim made from the Radiologist to the Insurance Company

    * Details of this claim will be displayed.

1. Click the **Pay Claim** button, and confirm in the dialog window

1. Log in as the Patient and choose the **Bills** tab

    * In a production system, the patient would likely log in through a patient portal rather than through this application.

1. Click on the open claim from the Radiologist, click the **Pay Bill** button and confirm on the dialog window


And that's the whole workflow! You've just worked through a complicated but typical workflow involving 4 separate parties with their respective privacy preserved throughout and information disclosed only where necessary.


CONFIDENTIAL © 2019 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
Any unauthorized use, duplication or distribution is strictly prohibited.
