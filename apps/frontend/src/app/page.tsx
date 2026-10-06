import { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Departments } from '@/components/Departments';
import { Doctors } from '@/components/Doctors';
import { BloodBank } from '@/components/BloodBank';
import { Notices } from '@/components/Notices';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Home',
  description: 'District Hospital Araria - Your trusted healthcare partner in Bihar. Book appointments, view doctors, check blood availability, and access healthcare services.',
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        <Hero />
        <Features />
        <Departments />
        <Doctors />
        <BloodBank />
        <Notices />
      </main>
      <Footer />
    </>
  );
}