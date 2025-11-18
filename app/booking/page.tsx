"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Clock, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { format, addMinutes, isAfter, parse } from "date-fns";
import AuthGuard from "@/components/AuthGuard";

/**
 * A compact, corrected Booking/Queue page.
 * This file fixes malformed imports and parsing errors and provides a minimal,
 * working listener for today's waiting appointments and a simple UI.
 */

type Appointment = {
  id: string;
  email?: string;
  barber?: string;
  date?: string;
  time?: string;
  status?: string;
  serviceName?: string;
  timestamp?: any;
  appointmentTime?: Date;
  fullName?: string | null;
};

const listenToQueue = (setQueue: (q: Appointment[]) => void) => {
  const today = format(new Date(), "MMMM d, yyyy");
  const q = query(
    collection(db, "appointments"),
    where("status", "==", "waiting"),
    where("date", "==", today)
  );

  const unsubscribe = onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        const now = new Date();
        const queue: Appointment[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data: any = docSnap.data();

          // Basic validation
          if (!data || !data.email || !data.barber || !data.date) continue;
          if (data.status !== "waiting") continue;

          // Determine appointmentTime
          let appointmentTime: Date | null = null;
          if (data.timestamp && typeof data.timestamp.toDate === "function") {
            appointmentTime = data.timestamp.toDate();
          } else if (data.date && data.time && typeof data.time === "string") {
            try {
              appointmentTime = parse(
                `${data.date} ${data.time}`,
                "MMMM d, yyyy h:mm a",
                new Date()
              );
              if (isNaN(appointmentTime.getTime())) {
                appointmentTime = parse(
                  `${data.date} ${data.time}`,
                  "MMMM d, yyyy HH:mm",
                  new Date()
                );
              }
            } catch {
              appointmentTime = new Date(`${data.date} ${data.time}`);
            }
          } else if (data.date) {
            appointmentTime = new Date(data.date);
          }

          if (!(appointmentTime instanceof Date) || isNaN(appointmentTime.getTime()))
            continue;

          // If appointment is older than 30 minutes, mark completed
          const appointmentEndTime = addMinutes(appointmentTime, 30);
          if (isAfter(now, appointmentEndTime)) {
            try {
              await updateDoc(docSnap.ref, {
                status: "completed",
                completedAt: Timestamp.now(),
              });
            } catch (err) {
              console.error("Failed to mark appointment completed:", err);
            }
            continue;
          }

          queue.push({
            id: docSnap.id,
            ...data,
            appointmentTime,
            fullName: data.fullName || null,
          });
        }

        // sort by appointmentTime ascending
        queue.sort((a, b) => a.appointmentTime!.getTime() - b.appointmentTime!.getTime());
        setQueue(queue);
      } catch (err) {
        console.error("listenToQueue error:", err);
      }
    },
    (err) => {
      console.error("listenToQueue snapshot error:", err);
    }
  );

  return unsubscribe;
};

const QueueSummary = ({ queue }: { queue: Appointment[] }) => {
  const capacity = queue.length;
  const avgWait = queue.length > 0 ? `${queue.length * 5} min` : "N/A";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Status</CardTitle>
        <CardDescription>Live view of the barbershop queue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Current capacity</div>
              <div className="text-2xl font-bold">{capacity} / 72</div>
            </div>
            <div>
              <div className="text-sm font-medium">Average wait time</div>
              <div className="text-2xl font-bold">{avgWait}</div>
            </div>
          </div>
          <div>
            <div className="text-sm">Capacity</div>
            <div>{Math.round((capacity / 72) * 100)}%</div>
            <Progress value={Math.min((capacity / 72) * 100, 100)} />
          </div>
          <div className="rounded-md bg-muted p-4">
            <div className="font-medium">Walk-in availability</div>
            <div className="text-sm text-muted-foreground">
              Walk-ins are currently available with an estimated wait time of 15-25 minutes.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QueueList = ({ queue }: { queue: Appointment[] }) => {
  return (
    <div className="space-y-4">
      {queue.map((customer, index) => (
        <div key={customer.id}>
          {index > 0 && <Separator className="my-4" />}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{customer.fullName || customer.email}</div>
              <div className="text-sm text-muted-foreground">
                {customer.serviceName || ""} {customer.barber ? `with ${customer.barber}` : ""}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {customer.appointmentTime
                ? customer.appointmentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function BookingPage() {
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenToQueue(setQueue);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || null);
    });
    return () => unsub();
  }, []);

  const userAppointment =
    userEmail && queue.length > 0
      ? queue.find((a) => (a.email || "").toLowerCase() === userEmail.toLowerCase()) || null
      : null;

  return (
    <AuthGuard>
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
              Current time: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <QueueSummary queue={queue} />
            <Card>
              <CardHeader>
                <CardTitle>Your Appointment</CardTitle>
                <CardDescription>Check your appointment status</CardDescription>
              </CardHeader>
              <CardContent>
                {userAppointment ? (
                  <div className="space-y-4">
                    <div className="font-semibold">{userAppointment.serviceName}</div>
                    <div className="text-sm">{userAppointment.barber}</div>
                    <div className="text-sm">
                      Scheduled:{" "}
                      {userAppointment.appointmentTime
                        ? userAppointment.appointmentTime.toLocaleString()
                        : "—"}
                    </div>
                    <div className="text-sm">Status: {userAppointment.status}</div>
                    <div>
                      <Button asChild>
                        <Link href="/booking">Book Another Appointment</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">You don't have an active appointment</p>
                    <div className="mt-4">
                      <Button asChild>
                        <Link href="/booking">Book an Appointment</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Current Queue</CardTitle>
                <CardDescription>All customers currently in queue</CardDescription>
              </CardHeader>
              <CardContent>
                <QueueList queue={queue} />
              </CardContent>
              <CardFooter className="flex justify-between">
                <div />
                <Button variant="outline">
                  Back
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

