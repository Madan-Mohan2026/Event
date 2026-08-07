import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { EventsPage } from '../pages/EventsPage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { RegistrationSuccessPage } from '../pages/RegistrationSuccessPage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailsPage />} />
        <Route path="register/:id" element={<RegistrationPage />} />
        <Route path="register/success/:id" element={<RegistrationSuccessPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
