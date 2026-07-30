import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import WelcomePage from './components/WelcomePage'
import MenuPage from './components/MenuPage'
import LogicGatesPage from './components/LogicGatesPage'
import LogicGatesCircuitPage from './components/LogicGatesCircuitPage'
import GearsPage from './components/GearsPage'
import LinkagesPage from './components/LinkagesPage'

const pageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.3, ease: "easeIn" } },
}

function App() {
  const [page, setPage] = useState("welcome")

  const navigateTo = (targetPage) => {
    setPage(targetPage)
  }

  const renderPage = () => {
    switch (page) {
      case "welcome":
        return <WelcomePage onNavigate={navigateTo} />
      case "menu":
        return <MenuPage onNavigate={navigateTo} />
      case "logic-gates":
        return <LogicGatesPage onNavigate={navigateTo} />
      case "logic-gates-circuit":
        return <LogicGatesCircuitPage onNavigate={navigateTo} />
      case "gears":
        return <GearsPage onNavigate={navigateTo} />
      case "linkages":
        return <LinkagesPage onNavigate={navigateTo} />
      default:
        return <WelcomePage onNavigate={navigateTo} />
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ minHeight: "100vh" }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            backgroundColor: "#1e293b",
            color: "#f8fafc",
            border: "1px solid #334155",
          },
        }}
      />
    </div>
  )
}

export default App