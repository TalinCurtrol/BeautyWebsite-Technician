export const TECHNICIAN_STATUS_CHECK_PASS = "pass";
export const TECHNICIAN_STATUS_CHECK_FAILED = "failed";
export const TECHNICIAN_STATUS_CHECK_ONGOING = "ongoing";
export const TECHNICIAN_STATUS_CHECK_WAITING = "waiting for upload";

export interface TechnicianAccount {
  [key: string]: any;
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postCode: string;
  cardNumber: string;
  verification: string; //0 or 1
  driverLicenseStatus: string; // pass or failed or ongoing or waiting for upload
  secondaryIdStatus: string; // pass or failed or ongoing or waiting for upload
  workingPermitStatus: string; // pass or failed or ongoing or waiting for upload
  driverLicenseImage: string;
  secondaryIdImage: string;
  workingPermitImage: string;
}

export interface TechnicianProfile {
  [key: string]: any;
  id: number;
  description: string;
  galleryImage1: string;
  galleryImage2: string;
  galleryImage3: string;
  galleryImage4: string;
  nailLicenseImage: string;
  facialLicenseImage: string;
  policeCheckImage: string;
  cvImage: string;
  specialty1: string;
  specialty2: string;
  specialty3: string;
}

export interface Job {
  id: number;
  customer_id: string;
  customer_name: string;
  customer_address: string;
  commissions: number;
  service_name: string;
  service_date: string;
  post_time: string;
}

export interface Transaction {
  id: number;
  technician_id: string;
  service_name: string;
  service_date: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  commissions: number;
  surcharge: number;
  current_state: string;
  accepted_time: string;
  on_the_way_time: string;
  in_progress_time: string;
  done_time: string;
  reviewed: number;
}

export interface timeUpdate {
  time: string; // YYYY/MM/DD hh:mm
  transaction_id: number;
}

export interface Transaction_review {
  order_id: string;
  rating: string;
  feedback: string;
}
