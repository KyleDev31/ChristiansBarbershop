"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Clock, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, query, where, onSnapshot, orderBy, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { format, addMinutes, isAfter } from "date-fns";

// --- Enhanced listenToQueue with validations and user name lookup ---
const listenToQueue = (setQueue: (queue: any[]) => void) => {
  const today = format(new Date(), "MMMM d, yyyy");
  const q = query(
    collection(db, "appointments"),
    where("status", "==", "waiting"),
    where("date", "==", today)
  );

  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    const now = new Date();
    let queue: any[] = [];

    // Collect emails to fetch user profiles
    const emailsToFetch = new Set<string>();

    // Process each appointment
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      // Skip invalid appointments
      if (!data.email || !data.barber || !data.date || !data.status || !data.serviceName) {
        continue;
      }

      // Skip non-waiting appointments
      if (data.status !== "waiting") continue;

      // Get appointment time (prefer timestamp field)
      const appointmentTime = data.timestamp?.toDate?.() || (typeof data.time === 'string' ? new Date(`${data.date} ${data.time}`) : new Date(data.date));
      if (!(appointmentTime instanceof Date) || isNaN(appointmentTime.getTime())) continue;

      // Check if appointment is past its duration (30 minutes)
      const appointmentEndTime = addMinutes(appointmentTime, 30);
      if (isAfter(now, appointmentEndTime)) {
        // Update appointment status to completed
        try {
          await updateDoc(docSnap.ref, {
            status: "completed",
            completedAt: Timestamp.now(),
          });
          continue; // Skip adding to queue
        } catch (error) {
          console.error("Error updating appointment status:", error);
        }
      }

      // Skip if appointment is too old or too far in future
      if (
        appointmentTime < new Date(now.getTime() - 24 * 60 * 60 * 1000) ||
        appointmentTime > new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      ) {
        continue;
      }

      // Skip duplicates
      if (
        queue.some(
          (q) =>
            q.email === data.email &&
            q.barber === data.barber &&
            q.appointmentTime?.getTime?.() === appointmentTime.getTime()
        )
      ) {
        continue;
      }

      // Skip invalid service or barber names
      if (typeof data.serviceName !== "string" || !data.serviceName.trim()) continue;
      if (typeof data.barber !== "string" || !data.barber.trim()) continue;

      // Collect email for profile lookup
      emailsToFetch.add(String(data.email).toLowerCase());

      // Add valid appointment to queue (raw data for now)
      queue.push({
        id: docSnap.id,
        ...data,
        appointmentTime,
        fullName: data.fullName || data.customerName || null,
      });
    }

    // If we have emails, fetch user profiles to resolve full names
    const emailArray = Array.from(emailsToFetch);
    if (emailArray.length > 0) {
      // Firestore 'in' supports up to 10 items per query — chunk if needed
      const chunkSize = 10;
      const nameMap: Record<string, string> = {};

      for (let i = 0; i < emailArray.length; i += chunkSize) {
        const chunk = emailArray.slice(i, i + chunkSize);
        try {
          const usersQ = query(collection(db, "users"), where("email", "in", chunk));
          const usersSnap = await getDocs(usersQ);
          usersSnap.docs.forEach((u) => {
            const d: any = u.data();
            const emailKey = (d.email || "").toString().toLowerCase();
            if (emailKey) {
              nameMap[emailKey] = d.fullName || d.displayName || d.name || "";
            }
          });
        } catch (err) {
          console.error("Failed to fetch user profiles for queue:", err);
        }
      }

      // Attach resolved full names to queue items
      queue = queue.map((item) => ({
        ...item,
        fullName: item.fullName || nameMap[String(item.email).toLowerCase()] || null,
      }));
    }

    // Sort queue by appointment time
    queue = queue.sort((a, b) => a.appointmentTime.getTime() - b.appointmentTime.getTime());

    setQueue(queue);
  });

  return unsubscribe;
};

const QueueSummary = ({ queue, progress }: { queue: any[]; progress: number }) => (
  <Card>
    <CardHeader>
      <CardTitle>Current Status</CardTitle>
      <CardDescription>Live view of the barbershop queue</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="grid gap-1">
            <div className="text-sm font-medium">Current capacity</div>
            <div className="text-2xl font-bold">{queue.length} / 30</div>
          </div>
          <div className="grid gap-1">
            <div className="text-sm font-medium">Average wait time</div>
            <div className="text-2xl font-bold">{queue.length > 0 ? `${queue.length * 5} min` : "N/A"}</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div>Capacity</div>
            <div>{Math.round((queue.length / 30) * 100)}%</div>
          </div>
          <Progress value={progress} />
        </div>
        <div className="rounded-md bg-muted p-4">
          <div className="font-medium">Walk-in availability</div>
          <div className="text-sm text-muted-foreground">
            Walk-ins are currently available with an estimated wait time of 15-25 minutes
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AppointmentCard = ({ appointment }: { appointment: any | null }) => (
  <Card>
    <CardHeader>
      <CardTitle>Your Appointment</CardTitle>
      <CardDescription>Check your appointment status</CardDescription>
    </CardHeader>
    <CardContent>
      {appointment ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="text-center">
            <div className="text-lg font-semibold">{appointment.serviceName}</div>
            <div className="text-sm text-muted-foreground mb-2">
              with {appointment.barber}
            </div>
            <div className="text-sm mb-2">
              Scheduled:{" "}
              {appointment.timestamp?.toDate
                ? appointment.timestamp.toDate().toLocaleString()
                : new Date(appointment.timestamp).toLocaleString()}
            </div>
            <div className="text-sm mb-2">
              Status: <span className="font-medium">{appointment.status}</span>
            </div>
            <div className="mt-4">
              <Button asChild>
                <Link href="/booking">Book Another Appointment</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">You don't have an active appointment</p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/booking">Book an Appointment</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const QueueList = ({ queue, filter }: { queue: any[]; filter?: (customer: any) => boolean }) => (
  <div className="space-y-4">
    {queue.filter(filter || (() => true)).map((customer, index) => (
      <div key={customer.id}>
        {index > 0 && <Separator className="my-4" />}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{customer.fullName || customer.customerName || customer.email}</div>
            <div className="text-sm text-muted-foreground">
              { (customer.serviceName || customer.service || "") }{customer.barber && ` with ${customer.barber}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {customer.estimatedWait === 0 ? "In progress" : `${customer.estimatedWait || 0} min wait`}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Utility to get unique barbers from the queue
const getUniqueBarbers = (queue: any[]) => {
  const barbers = queue.map((q) => q.barber).filter(Boolean);
  return Array.from(new Set(barbers));
};

const QueueTabs = ({ queue }: { queue: any[] }) => {
  const barbers = getUniqueBarbers(queue);

  return (
    <Tabs defaultValue="all" className="mt-6">
      <TabsList className={`grid w-full grid-cols-${barbers.length + 1}`}>
        <TabsTrigger value="all">All</TabsTrigger>
        {barbers.map((barber) => (
          <TabsTrigger key={barber} value={barber}>
            {barber}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="all" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Queue</CardTitle>
            <CardDescription>All customers currently in queue</CardDescription>
          </CardHeader>
          <CardContent>
            <QueueList queue={queue} />
          </CardContent>
        </Card>
      </TabsContent>
      {barbers.map((barber) => (
        <TabsContent key={barber} value={barber} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{barber}'s Queue</CardTitle>
              <CardDescription>Customers waiting for {barber}</CardDescription>
            </CardHeader>
            <CardContent>
              <QueueList queue={queue} filter={(customer) => customer.barber === barber} />
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};

// Get today's date in the same format as your booking (e.g., "May 24, 2025")
const today = format(new Date(), "MMMM d, yyyy");

const fetchTodaysQueue = async () => {
  const appointmentsRef = collection(db, "appointments");
  const q = query(
    appointmentsRef,
    where("date", "==", today),
    where("status", "==", "waiting")
  );
  const querySnapshot = await getDocs(q);
  const queue = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as { id: string; time: string; barber: string; email: string; status: string }[];
  queue.sort((a, b) => a.time.localeCompare(b.time));
  return queue;
};

export default function QueuePage() {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [queue, setQueue] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAppointment, setUserAppointment] = useState<any | null>(null);

  useEffect(() => {
    setProgress((queue.length / 9) * 100);
  }, [queue]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = listenToQueue(setQueue);
    return () => unsubscribe();
  }, []);

  // Get logged in user's email (Firebase Auth)
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Use the authenticated user's email for appointment matching
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  // Find the user's appointment in the queue
  useEffect(() => {
    if (!userEmail) {
      setUserAppointment(null);
      return;
    }
    const active = queue.find((appt) => {
      // Compare emails case-insensitively and allow both waiting and in-progress states
      const apptEmail = (appt.email || appt.customerName || "").toString().toLowerCase();
      const uEmail = (userEmail || "").toString().toLowerCase();
      return apptEmail && uEmail && apptEmail === uEmail && (appt.status === "waiting" || appt.status === "in-progress");
    });
    setUserAppointment(active || null);
  }, [queue, userEmail]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="container max-w-4xl py-10">
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Queue Status</h1>
          <p className="text-muted-foreground">
            Current time: {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <QueueSummary queue={queue} progress={progress} />
          <AppointmentCard appointment={userAppointment} />
        </div>

        <QueueTabs queue={queue} />
      </div>
    </div>
  );
}
