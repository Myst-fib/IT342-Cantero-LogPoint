// web/src/features/weather/WeatherWidget.js
import React, { useState, useEffect, useCallback } from 'react';
import './WeatherWidget.css';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const CITY    = 'Cebu City';          // change to your facility's city
const UNITS   = 'metric';             // 'imperial' for °F

// Map OWM icon codes → a simple emoji so we stay dependency-free
const iconEmoji = (icon = '') => {
  if (icon.startsWith('01')) return '☀️';
  if (icon.startsWith('02')) return '🌤️';
  if (icon.startsWith('03')) return '⛅';
  if (icon.startsWith('04')) return '☁️';
  if (icon.startsWith('09')) return '🌧️';
  if (icon.startsWith('10')) return '🌦️';
  if (icon.startsWith('11')) return '⛈️';
  if (icon.startsWith('13')) return '❄️';
  if (icon.startsWith('50')) return '🌫️';
  return '🌡️';
};

const WeatherWidget = () => {
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  const fetchWeather = useCallback(async () => {
    if (!API_KEY) {
      setError('API key missing. Set REACT_APP_WEATHER_API_KEY in your .env file.');
      setLoading(false);
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(CITY)}&units=${UNITS}&appid=${API_KEY}`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status}`);
      const data = await res.json();

      setWeather({
        city:        data.name,
        country:     data.sys.country,
        temp:        Math.round(data.main.temp),
        feelsLike:   Math.round(data.main.feels_like),
        humidity:    data.main.humidity,
        windSpeed:   Math.round(data.wind.speed * 3.6), // m/s → km/h
        description: data.weather[0].description,
        icon:        data.weather[0].icon,
        visibility:  data.visibility ? Math.round(data.visibility / 1000) : null,
        updatedAt:   new Date().toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila',
        }),
      });
      setError(null);
    } catch (err) {
      setError('Could not load weather data.');
      console.error('[WeatherWidget]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount, then refresh every 10 minutes
  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchWeather]);

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="weather-widget weather-skeleton">
        <div className="weather-skeleton-icon" />
        <div className="weather-skeleton-lines">
          <div className="weather-skeleton-line w60" />
          <div className="weather-skeleton-line w40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget weather-error">
        <span className="weather-error-icon">⚠️</span>
        <span className="weather-error-msg">{error}</span>
        <button className="weather-retry" onClick={fetchWeather}>Retry</button>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      {/* Left — icon + temperature */}
      <div className="weather-main">
        <span className="weather-emoji">{iconEmoji(weather.icon)}</span>
        <div className="weather-temp-block">
          <span className="weather-temp">{weather.temp}°C</span>
          <span className="weather-desc">{weather.description}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="weather-divider" />

      {/* Right — detail pills */}
      <div className="weather-details">
        <div className="weather-location">
          📍 {weather.city}, {weather.country}
        </div>
        <div className="weather-pills">
          <span className="weather-pill">💧 {weather.humidity}%</span>
          <span className="weather-pill">💨 {weather.windSpeed} km/h</span>
          <span className="weather-pill">🌡️ Feels {weather.feelsLike}°C</span>
          {weather.visibility !== null && (
            <span className="weather-pill">👁️ {weather.visibility} km</span>
          )}
        </div>
        <div className="weather-updated">Updated {weather.updatedAt}</div>
      </div>
    </div>
  );
};

export default WeatherWidget;