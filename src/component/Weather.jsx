import React, { useState } from 'react';
import axios from 'axios';
import { Box, Container, Typography, TextField, Button, Card, CardContent, CircularProgress, Alert, Paper } from '@mui/material';
import Grid from "@mui/material/Grid2"
import { Search as SearchIcon } from '@mui/icons-material';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const LOCATION_API_URL = 'http://dataservice.accuweather.com/locations/v1/cities/search';
const CURRENT_WEATHER_API_URL = 'https://dataservice.accuweather.com/currentconditions/v1/';

function WeatherApp() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!city.trim()) return;

    setLoading(true);
    try {
      // Request the location data using the city name
      const locationResponse = await axios.get(LOCATION_API_URL, {
        params: {
          apikey: API_KEY,
          q: city, 
        },
      });

      console.log('Location response:', locationResponse.data);

      // Check if the response contains any data and handle error
      if (!locationResponse.data || locationResponse.data.length === 0) {
        setError('City not found. Please check the spelling and try again.');
        setWeatherData(null);
        setLoading(false);
        return;
      }

      const location = locationResponse.data[0];
      const locationKey = location.Key;
      const cityName = location.LocalizedName;
      const countryName = location.Country.LocalizedName;

      console.log(`City: ${cityName}, Country: ${countryName}`);

      // Fetch weather data using the location key
      const weatherResponse = await axios.get(`${CURRENT_WEATHER_API_URL}${locationKey}`, {
        params: {
          apikey: API_KEY,
          details: true, 
        },
      });

      console.log('Weather response:', weatherResponse.data);

      if (!weatherResponse.data || weatherResponse.data.length === 0) {
        setError('Weather data not available for this location.');
        setWeatherData(null);
        setLoading(false);
        return;
      }

      const currentWeather = weatherResponse.data[0];

      if (!currentWeather || !currentWeather.Temperature || !currentWeather.Temperature.Metric) {
        console.error('Missing required weather properties:', currentWeather);
        setError('Weather data is incomplete or in an unexpected format.');
        setWeatherData(null);
        setLoading(false);
        return;
      }

      const combinedData = {
        ...currentWeather,
        LocalizedName: cityName,
        Country: {
          LocalizedName: countryName
        }
      };

      setWeatherData(combinedData);
      setError(null);
    } catch (err) {
      console.error("Error details:", err.response ? err.response.data : err.message);
      setError('An error occurred while fetching the weather data. Please try again later.');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const getWeatherIcon = (iconCode) => {
    return iconCode ? `https://developer.accuweather.com/sites/default/files/${iconCode < 10 ? "0" + iconCode : iconCode}-s.png` : '';
  };

  const renderSafe = (render, fallback = 'N/A') => {
    try {
      return render();
    } catch (e) {
      console.warn('Failed to render value:', e);
      return fallback;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f9fafc' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Weather App
        </Typography>

        <Box sx={{ display: 'flex', mb: 4 }}>
          <TextField
            fullWidth
            label="Enter city name"
            variant="outlined"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ ml: 2 }}
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          weatherData && (
            <Card elevation={2} sx={{ backgroundColor: '#fff' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Typography variant="h5" component="div">
                    {weatherData.LocalizedName}, {weatherData.Country.LocalizedName}
                  </Typography>
                  <Typography color="text.secondary">
                    {new Date(weatherData.LocalObservationDateTime).toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <img
                    src={getWeatherIcon(weatherData.WeatherIcon)}
                    alt={weatherData.WeatherText}
                    width="80"
                  />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h3" component="div">
                      {renderSafe(() => Math.round(weatherData.Temperature.Metric.Value))}°C
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {weatherData.WeatherText || 'Unknown'}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Feels Like
                    </Typography>
                    <Typography variant="body1">
                      {renderSafe(() => Math.round(weatherData.RealFeelTemperature.Metric.Value))}°C
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Humidity
                    </Typography>
                    <Typography variant="body1">
                      {weatherData.RelativeHumidity || 'N/A'}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Wind Speed
                    </Typography>
                    <Typography variant="body1">
                      {renderSafe(() => weatherData.Wind.Speed.Metric.Value)} km/h
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pressure
                    </Typography>
                    <Typography variant="body1">
                      {renderSafe(() => weatherData.Pressure.Metric.Value)} mb
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )
        )}
      </Paper>
    </Container>
  );
}

export default WeatherApp;