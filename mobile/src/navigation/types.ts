export type TechnicianStackParamList = {
  JobList: undefined;
  JobDetail: { jobId: string };
  Viewer3D: { jobId: string; modelUrl: string };
};

export type AuthStackParamList = {
  SignIn: undefined;
};

export type CustomerHomeStackParamList = {
  CustomerHome: undefined;
  ReportProblem: undefined;
};

export type CustomerTabParamList = {
  CustomerHomeStack: undefined;
  CustomerTickets: undefined;
  CustomerChat: undefined;
};

export type AdminTabParamList = {
  AdminTickets: undefined;
  AdminSupportChats: undefined;
  AdminTechnicians: undefined;
  AdminAccount: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  AdminTicketDetail: { ticketId: string };
  AdminSupportChat: { customerEmail: string; customerName: string };
};
