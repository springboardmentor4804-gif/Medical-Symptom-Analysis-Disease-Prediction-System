import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, HeartPulse, Loader2,
  Plus, RotateCcw, Search, Stethoscope, X,
} from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { Button } from '../components/med/Button'
import { Card, CardTitle } from '../components/med/Card'
import {
  DiagnosisPanel, RiskPanel, SeverityBreakdown, TreatmentPanel, TriageBanner,
} from '../components/med/ResultPanels'
import { cn } from '../lib/utils'

const STEPS = ['Symptoms', 'Health profile', 'Vitals', 'Results']

const SEVERITY_CHOICES = [
  { value: 'low', label: 'Mild', style: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'moderate', label: 'Moderate', style: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'high', label: 'Severe', style: 'border-red-300 bg-red-50 text-red-700' },
]

const VITAL_FIELDS = [
  { key: 'heart_rate', label: 'Heart rate', unit: 'bpm', placeholder: '72' },
  { key: 'systolic_bp', label: 'Blood pressure (systolic)', unit: 'mmHg', placeholder: '120' },
  { key: 'diastolic_bp', label: 'Blood pressure (diastolic)', unit: 'mmHg', placeholder: '80' },
  { key: 'temperature_c', label: 'Temperature', unit: '°C', placeholder: '36.8', step: '0.1' },
  { key: 'respiratory_rate', label: 'Breathing rate', unit: '/min', placeholder: '16' },
  { key: 'spo2', label: 'Oxygen saturation', unit: '%', placeholder: '98' },
]

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
        checked ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
      )}
    >
      <span className={cn(
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition',
        checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
      )}>
        {checked && <span className="text-xs leading-none">✓</span>}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </button>
  )
}

export default function SymptomChecker() {
  const [step, setStep] = useState(0)
  const [reference, setReference] = useState(null)
  const [refError, setRefError] = useState('')

  // step 0
  const [selected, setSelected] = useState([]) // [{ name, severity }]
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState('male')

  // step 1 — chronic risk profile
  const [includeProfile, setIncludeProfile] = useState(true)
  const [heightCm, setHeightCm] = useState(170)
  const [weightKg, setWeightKg] = useState(70)
  const [smokerStatus, setSmokerStatus] = useState(4)
  const [exercise, setExercise] = useState(true)
  const [highCholesterol, setHighCholesterol] = useState(false)
  const [highBloodPressure, setHighBloodPressure] = useState(false)
  const [alcoholDays, setAlcoholDays] = useState(0)
  const [generalHealth, setGeneralHealth] = useState(3)
  const [sleepHours, setSleepHours] = useState(7)
  const [physicalDays, setPhysicalDays] = useState(0)
  const [mentalDays, setMentalDays] = useState(0)
  const [meetsActivity, setMeetsActivity] = useState(true)

  // step 2
  const [vitals, setVitals] = useState({})

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    api.get('/reference-data')
      .then((res) => setReference(res.data))
      .catch((err) => setRefError(errorMessage(err, 'Could not load symptom reference data')))
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const bmi = useMemo(() => {
    const m = heightCm / 100
    return m ? +(weightKg / (m * m)).toFixed(1) : 0
  }, [heightCm, weightKg])

  // The vocabulary is the model's own 377 feature columns. Anything not on
  // this list is dropped by the backend, so the picker only offers these.
  const vocabulary = reference?.symptoms ?? []

  const suggestions = useMemo(() => {
    if (!vocabulary.length) return []
    const q = query.trim().toLowerCase()
    const chosen = new Set(selected.map((s) => s.name))
    const pool = vocabulary.filter((s) => !chosen.has(s.name))
    if (!q) return pool.filter((s) => s.red_flag).slice(0, 8)
    const starts = pool.filter((s) => s.name.startsWith(q))
    const contains = pool.filter((s) => !s.name.startsWith(q) && s.name.includes(q))
    return [...starts, ...contains].slice(0, 10)
  }, [vocabulary, query, selected])

  const criticalPicked = useMemo(() => {
    const crit = new Set(reference?.red_flags?.critical ?? [])
    return selected.filter((s) => crit.has(s.name))
  }, [selected, reference])

  const addSymptom = (name) => {
    if (!name || selected.some((s) => s.name === name)) return
    setSelected((l) => [...l, { name, severity: 'moderate' }])
    setQuery('')
    setOpen(false)
  }
  const removeSymptom = (name) => setSelected((l) => l.filter((s) => s.name !== name))
  const setSeverity = (name, severity) =>
    setSelected((l) => l.map((s) => (s.name === name ? { ...s, severity } : s)))

  const setVital = (key, raw) => {
    setVitals((v) => {
      const next = { ...v }
      if (raw === '' || raw == null) delete next[key]
      else next[key] = Number(raw)
      return next
    })
  }

  const canSubmit = selected.length > 0 && age >= 0

  const reset = () => {
    setResult(null); setSelected([]); setVitals({}); setStep(0); setError('')
  }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const payload = {
        symptoms: selected,
        age: Number(age),
        gender,
        ...(Object.keys(vitals).length ? { vitals } : {}),
        ...(includeProfile
          ? {
            lifestyle: {
              age: Number(age),
              sex: gender,
              bmi,
              smoker_status: Number(smokerStatus),
              exercise,
              high_cholesterol: highCholesterol,
              high_blood_pressure: highBloodPressure,
              alcohol_days_per_month: Number(alcoholDays),
              general_health: Number(generalHealth),
              sleep_hours: Number(sleepHours),
              physical_unwell_days: Number(physicalDays),
              mental_unwell_days: Number(mentalDays),
              meets_activity_guidance: meetsActivity,
            },
          }
          : {}),
      }
      const res = await api.post('/assess', payload)
      setResult(res.data)
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(errorMessage(err, 'Assessment failed'))
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Symptom checker</h1>
        <p className="mt-1 text-sm text-slate-600">
          Informational decision support — not a diagnosis. Seek emergency care
          for any red-flag symptom.
        </p>
      </header>

      {/* stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition',
                i === step ? 'bg-gradient-primary text-white shadow-primary'
                  : i < step ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-slate-100 text-slate-400'
              )}
            >
              {i + 1}
            </button>
            <span className={cn('hidden truncate text-xs font-medium sm:block',
              i === step ? 'text-slate-900' : 'text-slate-400')}>{s}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      {refError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{refError}</div>
      )}

      {/* ---------------- step 0: symptoms ---------------- */}
      {step === 0 && (
        <Card>
          <CardTitle icon={<Stethoscope className="h-5 w-5" />}>What are you experiencing?</CardTitle>

          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={cn(inputCls, 'pl-9')}
                placeholder="Search symptoms — e.g. “chest”, “cough”, “headache”"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
              />
            </div>

            {open && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lift">
                {!query.trim() && (
                  <li className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Urgent symptoms
                  </li>
                )}
                {suggestions.map((s) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => addSymptom(s.name)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50"
                    >
                      <span className="truncate">{s.name}</span>
                      {s.critical
                        ? <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">URGENT</span>
                        : s.red_flag
                          ? <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">SERIOUS</span>
                          : <Plus className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {vocabulary.length
              ? `Pick from the ${vocabulary.length} symptoms the model recognises — free text outside this list is ignored.`
              : 'Loading symptom vocabulary…'}
          </p>

          {/* live urgent warning */}
          {criticalPicked.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-3.5"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="text-sm text-red-800">
                <strong>{criticalPicked.map((s) => s.name).join(', ')}</strong> can indicate a
                medical emergency. If this is sudden or severe, call your local
                emergency number now rather than waiting for this assessment.
              </div>
            </motion.div>
          )}

          {/* selected symptoms + severity */}
          <div className="mt-5 space-y-2.5">
            {selected.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                No symptoms added yet.
              </p>
            )}
            {selected.map((s) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{s.name}</span>
                <div className="flex gap-1">
                  {SEVERITY_CHOICES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSeverity(s.name, c.value)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-semibold transition',
                        s.severity === c.value ? c.style : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => removeSymptom(s.name)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Age">
              <input type="number" min="0" max="120" className={inputCls}
                value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
            <Field label="Sex">
              <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(1)} disabled={selected.length === 0}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------- step 1: chronic risk profile ---------------- */}
      {step === 1 && (
        <Card>
          <CardTitle icon={<HeartPulse className="h-5 w-5" />}>Health profile</CardTitle>

          {/* This is the point people get wrong: the risk models share NO inputs
              with the symptom model, so skipping this step disables risk entirely. */}
          <p className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-indigo-900">
            Chronic risk screening uses lifestyle and demographic factors — it
            cannot be derived from symptoms. Skip this and the risk panel stays
            empty; every individual answer is still optional.
          </p>

          <Toggle
            checked={includeProfile}
            onChange={setIncludeProfile}
            label="Include chronic condition risk screening"
            hint="Screens 10 conditions against 1.1M CDC survey respondents"
          />

          {includeProfile && (
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Height (cm)">
                  <input type="number" className={inputCls} value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)} />
                </Field>
                <Field label="Weight (kg)">
                  <input type="number" className={inputCls} value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)} />
                </Field>
                <Field label="BMI" hint="calculated">
                  <input readOnly className={cn(inputCls, 'bg-slate-50 text-slate-500')} value={bmi} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Smoking status">
                  <select className={inputCls} value={smokerStatus}
                    onChange={(e) => setSmokerStatus(e.target.value)}>
                    {(reference?.smoker_status_options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="General health">
                  <select className={inputCls} value={generalHealth}
                    onChange={(e) => setGeneralHealth(e.target.value)}>
                    {(reference?.general_health_options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Sleep per night (hours)">
                  <input type="number" min="0" max="24" step="0.5" className={inputCls}
                    value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
                </Field>
                <Field label="Alcohol days per month">
                  <input type="number" min="0" max="31" className={inputCls}
                    value={alcoholDays} onChange={(e) => setAlcoholDays(e.target.value)} />
                </Field>
                <Field label="Days physically unwell (last 30)">
                  <input type="number" min="0" max="30" className={inputCls}
                    value={physicalDays} onChange={(e) => setPhysicalDays(e.target.value)} />
                </Field>
                <Field label="Days mentally unwell (last 30)">
                  <input type="number" min="0" max="30" className={inputCls}
                    value={mentalDays} onChange={(e) => setMentalDays(e.target.value)} />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle checked={exercise} onChange={setExercise}
                  label="Any physical activity in the last 30 days" />
                <Toggle checked={meetsActivity} onChange={setMeetsActivity}
                  label="Meets recommended activity levels"
                  hint="~150 min moderate exercise per week" />
                <Toggle checked={highBloodPressure} onChange={setHighBloodPressure}
                  label="Told I have high blood pressure" />
                <Toggle checked={highCholesterol} onChange={setHighCholesterol}
                  label="Told I have high cholesterol" />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(2)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------- step 2: vitals ---------------- */}
      {step === 2 && (
        <Card>
          <CardTitle icon={<Activity className="h-5 w-5" />}>Vital signs (optional)</CardTitle>
          <p className="mb-4 text-sm text-slate-600">
            If you have recent readings, they sharpen the urgency assessment — a
            reading far outside the normal range escalates the case on its own.
            Leave blank if unknown.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {VITAL_FIELDS.map((f) => {
              const range = reference?.vital_ranges?.[f.key]
              return (
                <Field key={f.key} label={`${f.label} (${f.unit})`}
                  hint={range ? `normal ${range.low}–${range.high}` : undefined}>
                  <input
                    type="number" step={f.step || '1'} className={inputCls}
                    placeholder={f.placeholder}
                    value={vitals[f.key] ?? ''}
                    onChange={(e) => setVital(f.key, e.target.value)}
                  />
                </Field>
              )
            })}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={submit} disabled={!canSubmit || loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
                : <>Run assessment <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------- step 3: results ---------------- */}
      {step === 3 && result && (
        <div className="space-y-5">
          <TriageBanner severity={result.severity} />
          <DiagnosisPanel diagnosis={result.diagnosis} />
          <RiskPanel risk={result.risk} />
          <TreatmentPanel treatment={result.treatment} />
          <SeverityBreakdown severity={result.severity} />

          <Card>
            <CardTitle>Model notes</CardTitle>
            <ul className="list-disc space-y-1.5 pl-5 text-xs text-slate-600">
              {result.meta?.caveats?.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {result.disclaimer}
            </p>
          </Card>

          <div className="flex justify-center">
            <Button variant="secondary" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Start a new assessment
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
