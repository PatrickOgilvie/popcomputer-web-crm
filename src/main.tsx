import './styles.css'
import { createInertiaApp } from '@inertiajs/react'
import type { PageName } from '@popcomputer/web/effect'
import type { WebPage } from '@popcomputer/web/react'
import { createRoot } from 'react-dom/client'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import CompaniesIndex from './pages/Companies/Index'
import CreateCompany from './pages/Companies/Create'
import EditCompany from './pages/Companies/Edit'
import ShowCompany from './pages/Companies/Show'
import ContactsIndex from './pages/Contacts/Index'
import CreateContact from './pages/Contacts/Create'
import EditContact from './pages/Contacts/Edit'
import ShowContact from './pages/Contacts/Show'
import Dashboard from './pages/Dashboard'
import Board from './pages/Deals/Board'
import CreateDeal from './pages/Deals/Create'
import EditDeal from './pages/Deals/Edit'
import ShowDeal from './pages/Deals/Show'
import ErrorPage from './pages/Errors/Error'
import SessionsIndex from './pages/Sessions/Index'
import TasksIndex from './pages/Tasks/Index'
import { appTitle } from './title'

// Every registered page's component: a page without one is a type error.
const components: { readonly [Name in PageName]: WebPage<Name> } = {
  'Auth/Login': Login,
  'Auth/Register': Register,
  Dashboard,
  'Deals/Board': Board,
  'Deals/Create': CreateDeal,
  'Deals/Show': ShowDeal,
  'Deals/Edit': EditDeal,
  'Contacts/Index': ContactsIndex,
  'Contacts/Create': CreateContact,
  'Contacts/Show': ShowContact,
  'Contacts/Edit': EditContact,
  'Companies/Index': CompaniesIndex,
  'Companies/Create': CreateCompany,
  'Companies/Show': ShowCompany,
  'Companies/Edit': EditCompany,
  'Tasks/Index': TasksIndex,
  'Sessions/Index': SessionsIndex,
}

const isPage = (name: string): name is PageName => name in components

void createInertiaApp({
  title: (title) => (title ? `${title} · ${appTitle}` : appTitle),
  // The error page is not a registered page: it answers any other name.
  resolve: (name) => (isPage(name) ? components[name] : ErrorPage),
  setup({ el, App, props }) {
    if (el !== null) createRoot(el).render(<App {...props} />)
  },
})
