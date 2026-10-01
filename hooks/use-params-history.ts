"use client"

import { useEffect, useReducer } from "react"

import type { Params } from "@/lib/fonderie/params"

// Réglages avec historique (Undo / Redo).
// Quand on fait glisser un curseur, toutes les petites étapes du même curseur
// (à moins d'une demi-seconde d'écart) comptent pour un seul pas d'historique.

const COALESCE_MS = 500
const MAX_STEPS = 100

type State = {
  present: Params
  past: Params[]
  future: Params[]
  lastKey: keyof Params | null
  lastAt: number
}

type Action =
  | { type: "set"; key: keyof Params; value: Params[keyof Params]; at: number }
  | { type: "replace"; params: Params; record: boolean }
  | { type: "undo" }
  | { type: "redo" }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "set": {
      if (s.present[a.key] === a.value) return s
      const present = { ...s.present, [a.key]: a.value }
      const coalesce = s.lastKey === a.key && a.at - s.lastAt < COALESCE_MS
      return {
        present,
        past: coalesce ? s.past : [...s.past, s.present].slice(-MAX_STEPS),
        future: [],
        lastKey: a.key,
        lastAt: a.at,
      }
    }
    case "replace":
      return {
        present: a.params,
        past: a.record ? [...s.past, s.present].slice(-MAX_STEPS) : s.past,
        future: a.record ? [] : s.future,
        lastKey: null,
        lastAt: 0,
      }
    case "undo": {
      if (!s.past.length) return s
      return {
        present: s.past[s.past.length - 1],
        past: s.past.slice(0, -1),
        future: [s.present, ...s.future],
        lastKey: null,
        lastAt: 0,
      }
    }
    case "redo": {
      if (!s.future.length) return s
      return {
        present: s.future[0],
        past: [...s.past, s.present],
        future: s.future.slice(1),
        lastKey: null,
        lastAt: 0,
      }
    }
  }
}

export function useParamsHistory(initial: Params) {
  const [state, dispatch] = useReducer(reducer, {
    present: initial,
    past: [],
    future: [],
    lastKey: null,
    lastAt: 0,
  })

  // ⌘Z / Ctrl+Z pour annuler, ⇧⌘Z / Ctrl+Y pour rétablir (sauf dans un champ de texte, qui a son propre annuler)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === "z" && !e.shiftKey) dispatch({ type: "undo" })
      else if ((k === "z" && e.shiftKey) || k === "y")
        dispatch({ type: "redo" })
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return {
    params: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    set:
      <K extends keyof Params>(key: K) =>
      (value: Params[K]) =>
        dispatch({ type: "set", key, value, at: performance.now() }),
    replace: (params: Params, record = true) =>
      dispatch({ type: "replace", params, record }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
  }
}
