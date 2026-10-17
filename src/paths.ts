// Every route's path, declared once: routes register on them, actions
// redirect to them and pages link to them with href.
export const paths = {
  dashboard: '/',
  login: '/login',
  register: '/register',
  logout: '/logout',

  pipeline: '/deals',
  newDeal: '/deals/create',
  deal: '/deals/{deal}',
  editDeal: '/deals/{deal}/edit',
  dealStage: '/deals/{deal}/stage',
  dealActivities: '/deals/{deal}/activities',

  contacts: '/contacts',
  newContact: '/contacts/create',
  contact: '/contacts/{contact}',
  editContact: '/contacts/{contact}/edit',
  contactActivities: '/contacts/{contact}/activities',

  companies: '/companies',
  newCompany: '/companies/create',
  company: '/companies/{company}',
  editCompany: '/companies/{company}/edit',
  companyActivities: '/companies/{company}/activities',

  tasks: '/tasks',
  activity: '/activities/{activity}',

  sessions: '/sessions',
  otherSessions: '/sessions/others',
  session: '/sessions/{session}',
} as const
