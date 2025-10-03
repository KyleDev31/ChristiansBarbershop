"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CalendarCheck, ChevronLeft, Clock, MapPin, Scissors, User } from "lucide-react";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ConfirmationDetails = ({ appointmentDate, appointmentTime, barberName, serviceName, price }: any) => (
  <CardContent className="space-y-4">
    <div className="rounded-lg bg-white p-4 dark:bg-background">
      <DetailItem icon={<Clock className="h-5 w-5 text-muted-foreground" />} title={appointmentDate} subtitle={`${appointmentTime}`} />
      <DetailItem icon={<User className="h-5 w-5 text-muted-foreground" />} title={barberName} subtitle="Classic Cuts Specialist" />
      <DetailItem icon={<MapPin className="h-5 w-5 text-muted-foreground" />} title="Christian's Barbershop" subtitle="P-12, Poblacion Nabunturan, Davao" />
    </div>
    <Separator />
    <div className="space-y-2">
      <DetailRow label="Service" value={serviceName} />
      <DetailRow label="Price" value={`Php ${price}`} valueClass="font-bold text-xl" />
    </div>
    <ImportantInfo />
    <Separator />
  </CardContent>
);

const DetailItem = ({ icon, title, subtitle }: any) => (
  <div className="mb-4 flex items-center gap-3">
    {icon}
    <div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{subtitle}</div>
    </div>
  </div>
);

const DetailRow = ({ label, value, valueClass }: any) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={valueClass}>{value}</span>
  </div>
);

const ImportantInfo = () => (
  <div className="rounded-lg bg-muted p-4">
    <div className="text-sm">
      <p className="font-medium">Important Information:</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
        <li>Please arrive 5 minutes before your appointment</li>
        <li>You'll receive an email reminder 1 day before your appointment</li>
        <li>Cancellations must be made at least 2 hours in advance</li>
      </ul>
    </div>
  </div>
);

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const customerName = searchParams?.get("name");
  const serviceName = searchParams?.get("service");
  const barberName = searchParams?.get("barber");
  const appointmentDate = searchParams?.get("date");
  const appointmentTime = searchParams?.get("time");
  const price = searchParams?.get("price") || "25.00";

  const transactionId = uuidv4();

  useEffect(() => {
    const saveAppointment = async () => {
      await addDoc(collection(db, "appointments"), {
        name: customerName || "John Doe",
        service: serviceName,
        barber: barberName,
        barberId: 1,
        status: "waiting",
        timestamp: serverTimestamp(),
        estimatedWait: 10,
      });
    };

    // saveAppointment();
  }, [customerName, serviceName, barberName]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="container max-w-2xl py-10">
        <Header />
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <div className="flex justify-center">
              <CalendarCheck className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-center text-xl">Booking Confirmed!</CardTitle>
            <CardDescription className="text-center">Your appointment has been successfully booked</CardDescription>
          </CardHeader>
          <ConfirmationDetails
            appointmentDate={appointmentDate}
            appointmentTime={appointmentTime}
            barberName={barberName}
            serviceName={serviceName}
            price={price}
          />
          <CardFooter className="flex flex-col gap-2">
            <FooterButtons />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

const Header = () => (
  <div className="mb-8 flex items-center">
    <Link href="/" className="flex items-center gap-2">
      <ChevronLeft className="h-4 w-4" />
      <span>Back to Home</span>
    </Link>
    <div className="ml-auto flex items-center gap-2">
      <Scissors className="h-5 w-5" />
      <span className="font-semibold">Christian's Barbershop</span>
    </div>
  </div>
);

const FooterButtons = () => (
  <>
    <Button className="w-full" asChild>
      <Link href="/queue">See Queue</Link>
    </Button>
    <Button variant="outline" className="w-full" asChild>
      <Link href="/profile">Go to Profile</Link>
    </Button>
  </>
);