import React, { useMemo, useState } from 'react';
import './SupportFunctions.css';

const PASSENGER_TYPES = [
  { value: 'wizzair', label: 'Wizz Air putnici' },
  { value: 'turkey', label: 'Putnici u Tursku' },
];

const parseDateUtc = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateDisplay = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
};

const getDayDifference = (fromDate, toDate) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((toDate - fromDate) / msPerDay);
};

const SupportFunctions = () => {
  const [passengerType, setPassengerType] = useState(PASSENGER_TYPES[0].value);
  const [returnDate, setReturnDate] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');

  const passengerLabel = PASSENGER_TYPES.find((option) => option.value === passengerType)?.label;

  const evaluation = useMemo(() => {
    if (!passengerType || !returnDate || !passportExpiry) {
      return null;
    }

    const returnDateUtc = parseDateUtc(returnDate);
    const passportExpiryUtc = parseDateUtc(passportExpiry);

    if (!returnDateUtc || !passportExpiryUtc) {
      return {
        status: 'error',
        title: 'Neispravni datumi',
        message: 'Provjerite da li su oba datuma ispravno unesena.',
        diffDays: null,
      };
    }

    const diffDays = getDayDifference(returnDateUtc, passportExpiryUtc);

    if (diffDays < 0) {
      return {
        status: 'error',
        title: 'Pasoš ističe prije povratka',
        message: 'Putnik ne može putovati jer pasoš važi kraće od datuma povratka.',
        diffDays,
      };
    }

    if (passengerType === 'wizzair') {
      if (diffDays <= 95) {
        return {
          status: 'error',
          title: 'Pasoš važi manje od 95 dana',
          message: 'Putnik ne može putovati jer pasoš važi 95 dana ili manje.',
          diffDays,
        };
      }

      return {
        status: 'success',
        title: 'Putnik može putovati',
        message: 'Pasoš važi duže od 95 dana.',
        diffDays,
      };
    }

    if (diffDays >= 160) {
      return {
        status: 'success',
        title: 'Putnik može putovati',
        message: 'Pasoš važi 160 dana ili više.',
        diffDays,
      };
    }

    if (diffDays >= 62) {
      return {
        status: 'warning',
        title: 'Putnik može putovati uz kaznu',
        message: 'Putnik može putovati, ali će platiti kaznu na aerodromu u Turskoj.',
        diffDays,
      };
    }

    return {
      status: 'error',
      title: 'Putnik ne može putovati',
      message: 'Pasoš važi 61 dan ili manje.',
      diffDays,
    };
  }, [passengerType, returnDate, passportExpiry]);

  return (
    <div className="support-functions-container">
      <h2>Pomoćne funkcije</h2>
      <div className="support-functions-grid">
        <div className="support-functions-card">
          <div className="support-functions-card-header">
            <div>
              <p className="support-functions-eyebrow">Kalkulator dana</p>
              <p className="support-functions-subtitle">
                Unesite tip putnika, datum povratka i datum isteka pasoša.
              </p>
            </div>
            <div className="support-functions-badge">Automatska provjera</div>
          </div>
          <div className="support-functions-highlight">
            <span>Tip putnika</span>
            <strong>{passengerLabel}</strong>
          </div>
          <div className="support-functions-hint">
            {passengerType === 'wizzair' ? (
              <p>Wizz Air: pasoš mora važiti više od 95 dana nakon povratka.</p>
            ) : (
              <p>Turska: 160+ bez kazne, 62-160 uz kaznu, 61 ili manje - ne može.</p>
            )}
          </div>
          <div className="support-functions-form">
            <div className="support-functions-field">
              <label htmlFor="passenger-type">Tip putnika</label>
              <select
                id="passenger-type"
                value={passengerType}
                onChange={(event) => setPassengerType(event.target.value)}
              >
                {PASSENGER_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="support-functions-field">
              <label htmlFor="return-date">Datum povratne karte</label>
              <input
                id="return-date"
                type="date"
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
              />
            </div>
            <div className="support-functions-field">
              <label htmlFor="passport-expiry">Datum isteka pasoša</label>
              <input
                id="passport-expiry"
                type="date"
                value={passportExpiry}
                onChange={(event) => setPassportExpiry(event.target.value)}
              />
            </div>
          </div>
          <div className="support-functions-dates">
            <div className={`support-functions-date ${returnDate ? 'filled' : ''}`}>
              <span>Povratak</span>
              <strong>{returnDate ? formatDateDisplay(returnDate) : 'Nije izabrano'}</strong>
            </div>
            <div className={`support-functions-date ${passportExpiry ? 'filled' : ''}`}>
              <span>Pasoš ističe</span>
              <strong>{passportExpiry ? formatDateDisplay(passportExpiry) : 'Nije izabrano'}</strong>
            </div>
          </div>
        </div>

        <div className="support-functions-card support-functions-card-compact">
          <h3>Brzi uslovi</h3>
          <div className="support-functions-rule">
            <span>Wizz Air putnici</span>
            <strong>Pasoš mora važiti više od 95 dana.</strong>
          </div>
          <div className="support-functions-rule">
            <span>Putnici u Tursku</span>
            <strong>160+ dana: može bez kazne.</strong>
          </div>
          <div className="support-functions-rule">
            <span>Putnici u Tursku</span>
            <strong>62-160 dana: može uz kaznu.</strong>
          </div>
          <div className="support-functions-rule">
            <span>Putnici u Tursku</span>
            <strong>61 ili manje dana: ne može.</strong>
          </div>
        </div>
      </div>

      {evaluation && (
        <div className={`support-functions-result ${evaluation.status}`}>
          <div>
            <h3>{evaluation.title}</h3>
            <p>{evaluation.message}</p>
          </div>
          {typeof evaluation.diffDays === 'number' && (
            <div className="support-functions-diff">
              <span>Razlika u danima</span>
              <strong>{evaluation.diffDays}</strong>
              <small>Pasoš u odnosu na povratak</small>
            </div>
          )}
          <div className={`support-functions-status ${evaluation.status}`}>
            {evaluation.status === 'success' && 'Može putovati'}
            {evaluation.status === 'warning' && 'Uz kaznu'}
            {evaluation.status === 'error' && 'Ne može'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportFunctions;
