export const ROOT_URL = `http://127.0.0.1:5000`;
export const LOGIN_URL = "http://127.0.0.1:3001/TechnicianEntry";

export const endpoints = {
  technician: {
    accountByuserName: `/technician_account/`, //get v
    submitAccount: "/technician_account", //post
    takeJob: "/takejob", //v
  },
  jobs: {
    within_10_miles: `/jobs/in10miles/`, //v
    more_10_miles: `/jobs/more10miles/`, //v
    specify_me: `/jobs/specifyme/`, //v
  },
  transaction: {
    getAllTransactions: `/transactions/`, //get//v
    updateTime: `/updatetime`, //v
    updateReview: `/updatetechnicianreview`, //v
    getReview: `/technicianreview/`, //v
    getTracking: `/transaction/tracking/`, //v
    serviceListByDate: `/servicedaylist`, //v
    highlightDate: `/getHighlightByMonth`, //v
  },
  fetchMatrics: `/getmatricsbydate`, //v
};
