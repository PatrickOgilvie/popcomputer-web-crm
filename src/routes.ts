import { action, render, RequireAuthLayer, RequireGuestLayer } from '@popcomputer/web/effect'
import { betterAuthLogoutAction } from '@popcomputer/web/auth'
import {
  completeTask,
  createTask,
  deleteActivity,
  listTasks,
  logCompanyActivity,
  logContactActivity,
  logDealActivity,
} from './actions/activities'
import { signIn, signUp } from './actions/auth'
import {
  createCompany,
  deleteCompany,
  editCompany,
  listCompanies,
  showCompany,
  updateCompany,
} from './actions/companies'
import {
  createContact,
  deleteContact,
  editContact,
  listContacts,
  newContact,
  showContact,
  updateContact,
} from './actions/contacts'
import { showDashboard } from './actions/dashboard'
import { createDeal, deleteDeal, editDeal, moveDeal, newDeal, showBoard, showDeal, updateDeal } from './actions/deals'
import { listSessions, revokeOtherSessions, revokeSession } from './actions/sessions'
import { routes } from './app'
import { paths } from './paths'

routes
  .provide(RequireGuestLayer)
  .get(paths.login, action(render('Auth/Login')))
  .post(paths.login, signIn)
  .get(paths.register, action(render('Auth/Register')))
  .post(paths.register, signUp)

routes.post(paths.logout, betterAuthLogoutAction({ redirectTo: paths.login }))

routes
  .provide(RequireAuthLayer)
  .get(paths.dashboard, showDashboard)

  .get(paths.pipeline, showBoard)
  .get(paths.newDeal, newDeal)
  .post(paths.pipeline, createDeal, { form: paths.newDeal })
  .get(paths.deal, showDeal)
  .get(paths.editDeal, editDeal)
  .put(paths.deal, updateDeal, { form: paths.editDeal })
  .delete(paths.deal, deleteDeal)
  .patch(paths.dealStage, moveDeal, { form: paths.pipeline })
  .post(paths.dealActivities, logDealActivity, { form: paths.deal })

  .get(paths.contacts, listContacts)
  .get(paths.newContact, newContact)
  .post(paths.contacts, createContact, { form: paths.newContact })
  .get(paths.contact, showContact)
  .get(paths.editContact, editContact)
  .put(paths.contact, updateContact, { form: paths.editContact })
  .delete(paths.contact, deleteContact)
  .post(paths.contactActivities, logContactActivity, { form: paths.contact })

  .get(paths.companies, listCompanies)
  .get(paths.newCompany, action(render('Companies/Create')))
  .post(paths.companies, createCompany, { form: paths.newCompany })
  .get(paths.company, showCompany)
  .get(paths.editCompany, editCompany)
  .put(paths.company, updateCompany, { form: paths.editCompany })
  .delete(paths.company, deleteCompany)
  .post(paths.companyActivities, logCompanyActivity, { form: paths.company })

  .get(paths.tasks, listTasks)
  .post(paths.tasks, createTask)
  .patch(paths.activity, completeTask, { form: paths.tasks })
  .delete(paths.activity, deleteActivity, { form: paths.tasks })

  .get(paths.sessions, listSessions)
  .delete(paths.otherSessions, revokeOtherSessions)
  .delete(paths.session, revokeSession, { form: paths.sessions })
