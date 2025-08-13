"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function BarberDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string>("available");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  // Get barber user and role
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocs = await getDocs(query(collection(db, "users"), where("email", "==", firebaseUser.email)));
        if (!userDocs.empty) {
          const data = userDocs.docs[0].data();
          setUserRole(data.role || null);
          setAvailability(data.availability || "available");
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch today's appointments for this barber
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setLoadingAppointments(true);
      const today = format(new Date(), "MMMM d, yyyy");
      const q = query(
        collection(db, "appointments"),
        where("barber", ">=", ""), // allow all barbers, filter below
        where("date", "==", today)
      );
      const querySnapshot = await getDocs(q);
      // Filter by barber email or name
      const appts = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(appt => typeof (appt as any).barber === "string" && ((appt as any).barber === user.displayName || (appt as any).barber === user.email));
      setAppointments(appts);
      setLoadingAppointments(false);
    };
    if (userRole === "barber" && user) fetchAppointments();
  }, [user, userRole]);

  // Toggle availability
  const handleToggleAvailability = async () => {
    if (!user) return;
    setAvailabilityLoading(true);
    try {
      const userDocs = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
      if (!userDocs.empty) {
        const userRef = userDocs.docs[0].ref;
        const newStatus = availability === "available" ? "unavailable_today" : "available";
        await updateDoc(userRef, { availability: newStatus });
        setAvailability(newStatus);
        toast.success(`Status set to ${newStatus === "available" ? "Available" : "Unavailable Today"}`);
      }
    } catch (err) {
      toast.error("Failed to update availability");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Appointment summary
  const summary = appointments.reduce(
    (acc, appt) => {
      acc[appt.status] = (acc[appt.status] || 0) + 1;
      return acc;
    },
    { waiting: 0, completed: 0, "in-progress": 0 }
  );

  if (userRole !== "barber") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Barber Dashboard</CardTitle>
            <CardDescription>Access restricted</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You must be logged in as a barber to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="container max-w-3xl py-10">
        <h1 className="text-3xl font-bold mb-6">Barber Dashboard</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Set your status for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Switch
                checked={availability === "available"}
                onCheckedChange={handleToggleAvailability}
                disabled={availabilityLoading}
                id="barber-availability-switch"
              />
              <span className={availability === "available" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {availability === "available" ? "Available" : "Unavailable Today"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>All appointments assigned to you for today</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAppointments ? (
              <div>Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div>No appointments for today.</div>
            ) : (
              <div className="space-y-4">
                {appointments.map(appt => (
                  <div key={appt.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{appt.serviceName}</div>
                      <div className="text-sm text-muted-foreground">{appt.email}</div>
                      <div className="text-sm">{appt.time}</div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 font-semibold capitalize">
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Today's appointment stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div>
                <div className="text-lg font-bold">{summary.waiting}</div>
                <div className="text-sm text-muted-foreground">Waiting</div>
              </div>
              <div>
                <div className="text-lg font-bold">{summary["in-progress"]}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-lg font-bold">{summary.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}    