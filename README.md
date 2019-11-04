# Reference Application: Healthcare Claims Processing

## Introduction

This application simulates processing a healthcare claim, starting with the referral from the Primary Care Provider (PCP) and including the creation of an appointment with the radiologist, checking in the patient on the date of the appointment, checking out the patient after service delivery, generation of the claim, and finally, payment for the procedure.

## Getting Started

### Installing

**Disclaimer:** This reference application is intended to demonstrate the capabilities of the DAML. You are recommended to consider other non-functional aspects, like security, resiliency, recoverability, etc prior to production use.

#### Prerequisites

Be sure you have the following installed:
- [DAML SDK](https://docs.daml.com/)
- Docker
- Java
- Maven

#### Build with Maven

Type:
```shell
mvn clean package
```
**Note:** If you change the DAML models locally, you need to re-run this command before starting the application.

### Starting the App

**Note:** Make sure you have built the application with Maven (see: [Build with Maven](#build-with-maven)).

There are two options:

#### Option 1: Start App with Docker

1. Type:
    ```shell
    docker-compose up --build
    ```
2. Open UI with a browser at http://localhost:7500.

#### Option 2: Start App in Standalone

1. Start the DAML Sandbox and Navigator. Type:
    ```shell
    daml start --sandbox-option --address=localhost
    ```
    The navigator will automatically open in new browser tab at http://localhost:7500.
2. Start the automation logic by starting bots. Type:
    ```shell
    java -jar target/healthcare-claims-processing-0.0.1-SNAPSHOT.jar
    ```

### Stopping the App

#### Stopping Dockerized Run
1. Stop the Docker containers or bots by pressing **Ctrl+C**. (Alternatively, you can also stop it by typing `docker-compose down`.)

#### Stopping Standalone Run
1. Stop the bots by pressing **Ctrl+C**.
1. Stop the Sandbox and the Navigator by pressing **Ctrl+C** in the DAML assistant.

### Resetting the Prototype

Reset the application by following these steps:
1.  Stop the app by following the steps in [Stopping the App](#stopping-the-app) section.
2.  Start the app in [Docker](#using-docker) or [Standalone](#standalone-mode) by following the steps in the relevant section.

## User Guide

This User Guide will take you step-by-step through healthcare claims processing, executing one successful claim.

**Note:** This demo is designed to show successful processing of a claim without exceptions or error conditions. A full production implementation would include additional features, handle errors and exceptions, and incorporate appropriate security controls.


## Workflow

**Roles and Responsibilities**


<table>
  <tr>
   <td><strong>Role</strong>
   </td>
   <td><strong>Responsibility</strong>
   </td>
  </tr>
  <tr>
   <td>Primary Care Provider
   </td>
   <td>A physician, who creates a referral for a patient
   </td>
  </tr>
  <tr>
   <td>Patient
   </td>
   <td>
     <p>Visits both physician and specialist (radiology lab)
<p>
After procedure is performed, pays appropriate portion of the bill
   </td>
  </tr>
  <tr>
   <td>Radiologist
   </td>
   <td>
<p>
Specialist, who creates appointment for a patient
<p>
Checks patient in and performs procedure
<p>
Checks patient out after procedure
   </td>
  </tr>
  <tr>
   <td>Insurance Company
   </td>
   <td>Pays for its portion of the bill after the procedure is performed
   </td>
  </tr>
</table>


**Steps**

The Healthcare Process workflow involves these steps:



1. **Referral** 

    The Primary Care Provider creates a referral for Patient 1 in the system, sending the patient to a radiology lab (Radiologist) for an x-ray of a possible fracture. The system checks to verify that the patient is eligible for treatment under their insurance and calculates the cost of the procedure for this patient. 


    Checks include:

    *   Validity of the patient’s insurance policy (in good standing, not expired)
    *   Network status of the radiologist (whether in or out of the insurance company’s approved provider list)
    *   Verification of eligibility and pre-authorization for the treatment

2. **Appointment** 

    The Radiologist now creates an appointment for the patient in the system. The system ensures that the treatment is appropriate for the diagnosis and that any necessary pre-authorization has been done. It checks again to ensure that the patient insurance status has not changed since the referral was created. 

3. **Check-In**

    The patient goes to the lab and is checked in. Again the system reruns all the previous checks to determine if any parameter has changed, for example, whether the patient has satisfied more of their deductible before this date.  

4. **Check-Out and Claim Creation** 

    The x-ray is done. The patient is checked out, and the claim is automatically created. The system creates an obligation for the patient to pay their portion of the cost (if any) and for the insurance company to pay its portion. 

5. **Payment**  

    The insurance company now pays the claim to the lab. The patient pays any required amount as well. The amounts paid are the verified amount established in first steps of the process.



## Running the Application


### Choosing and Changing Roles 

When you launch the application, you will see the Navigator screen with the option to choose your role. 

To log in:



*   On the home screen, select the party from the list.

To switch users:



1. Click the name of the current party at the top of the screen.
2. On the home screen, select a different party.


## Referral

The workflow begins with the patient visiting their Primary Care Provider physician (PCP) for treatment. The PCP decides the patient needs an X-ray and creates a referral.

To create a referral:



1. Log in as Primary Care Provider. 

   In the application, Dr. Paige Mattel is the name of the PCP.
2. Go to **Provider Actions** tab and click on the contract.
3. Select the **CreateReferral** choice.
4. Enter Referral values:
    * Receiver: Radiologist
    * Policy: #38:11
    * Encounter id: 1
    * Procedure code: Preventative_Care
    * Diagnosis code: Pain_in_right_arm_M79_601
    * Site service code: 11
    * Appointment priority: Elective
5. Choose **Submit**.

**Note:** The Network contract ID is the policy ID between the Radiologist and the Insurance Company. 


## Scheduling

The next step is scheduling the appointment for the x-ray. 

To schedule:



1. Log in as the Radiologist.
2. Choose the **Referrals** tab.
3. Click on the new referral you just created.
4. Choose **Schedule Appointment**.
5. Select the date and time for the appointment on the New Appointment pane and choose the **Schedule** button.

   The new appointment is now visible to the Radiologist and Patient 1. A confirmation tick mark confirms that the appointment has been scheduled. 
   
   The various checks are run again, and the payment requirements are displayed, showing now what payment the lab will receive and what the patient will owe.

**Note:** The PCP does not have any visibility into this part of the workflow, as the appointment scheduling is only disclosed to the patient, the radiologist, and the insurer.

## Check-In

The next step is for the patient to arrive at the lab for the x-ray and be checked in. 

**Note:** The application checks for match between the current date and the appointment date. To check the patient in, log in as Radiologist, and change the system date to the appointment date in the top right corner. 

To check the patient in:



1. Log in as the Radiologist and choose the **Appointments** tab.
2. On the Appointments screen, locate the newly created appointment.
3. Choose the appointment and choose **Check In**.

   The various checks are run again to confirm that the patient is still eligible and to recalculate the payments to account for any changes, such as a situation where the patient has satisfied part of their deductible.


## Check-Out and Claim Creation

After the x-ray is done, the patient is checked out from the facility, and the claim is created.

To check out the patient:



1. Log in as Radiologist if you have logged out.
2. Choose **Treatments** on the dashboard menu bar.
3. On the Treatments tab, choose the treatment with the patient’s name and choose **CompleteTreatment.**
4. Choose **Submit.**

   A confirmation tick will be displayed. 



5. Choose the **View Claim** button to view all the details on the claim.


## Payment

The last step of this workflow is for payment to be made to the lab by both the insurance company and the patient.

To make payment:



1. Log in as Insurance Company and choose the **Claims** tab.
2. On the Claims list screen, choose the claim between the Radiologist and the Insurance Company.

   Details on this claim will be displayed.

3. To pay the claim, choose the **Pay Claim** button.
4. Enter the Policy contract id: #43:4

   Payment will be sent to the Radiologist. The Radiologist can view their claims and see that this one is no longer an open claim by clicking on the **Claims** tab and enabling the **Include Archived** choice.

5. Log in as Patient 1 and choose the **Patient Obligation** tab.

    **Note:** In a production system, the patient would likely log in through a patient portal rather than through this application.

6. Choose the open claim and choose the **Pay Patient Obligation** button to pay the patient’s portion of the claim. 
7. Choose **Submit**.

    Payment will be made to the Radiologist.
    

CONFIDENTIAL © 2019 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
Any unauthorized use, duplication or distribution is strictly prohibited.
