import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const timeLogsRef = collection(db, "timeLogs");
    const q = query(timeLogsRef, where("userId", "==", userId));

    // Add timeout for Firestore query
    const queryPromise = getDocs(q);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), 15000)
    );

    const querySnapshot = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as any;

    const logs = querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        loginTime: data.loginTime?.toDate?.().toISOString() || data.loginTime,
        logoutTime:
          data.logoutTime?.toDate?.().toISOString() || data.logoutTime,
        workHours: data.workHours || 0,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      };
    });

    // Sort by loginTime descending on server-side
    logs.sort(
      (a: any, b: any) =>
        new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
    );

    return NextResponse.json({ logs }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching time logs:", error);

    // Return empty array on timeout instead of error
    if (error.message === "Query timeout") {
      console.warn("Firestore query timeout, returning empty array");
      return NextResponse.json({ logs: [] }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Failed to fetch time logs", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, loginTime, logoutTime } = body;

    if (!userId || !loginTime) {
      return NextResponse.json(
        { error: "User ID and login time are required" },
        { status: 400 }
      );
    }

    const loginTimestamp = Timestamp.fromDate(new Date(loginTime));
    const logoutTimestamp = logoutTime
      ? Timestamp.fromDate(new Date(logoutTime))
      : null;

    let workHours = 0;
    if (logoutTimestamp) {
      const diff = logoutTimestamp.toMillis() - loginTimestamp.toMillis();
      workHours = diff / (1000 * 60 * 60);
    }

    const timeLogsRef = collection(db, "timeLogs");
    const docRef = await addDoc(timeLogsRef, {
      userId,
      loginTime: loginTimestamp,
      logoutTime: logoutTimestamp,
      workHours,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json(
      {
        id: docRef.id,
        message: "Time log created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating time log:", error);
    return NextResponse.json(
      { error: "Failed to create time log", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, loginTime, logoutTime } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Log ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "timeLogs", id);
    const updateData: any = {};

    if (loginTime) {
      updateData.loginTime = Timestamp.fromDate(new Date(loginTime));
    }

    if (logoutTime) {
      updateData.logoutTime = Timestamp.fromDate(new Date(logoutTime));
    }

    if (updateData.loginTime && updateData.logoutTime) {
      const diff =
        updateData.logoutTime.toMillis() - updateData.loginTime.toMillis();
      updateData.workHours = diff / (1000 * 60 * 60);
    }

    await updateDoc(docRef, updateData);

    return NextResponse.json(
      { message: "Time log updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating time log:", error);
    return NextResponse.json(
      { error: "Failed to update time log", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Log ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "timeLogs", id);
    await deleteDoc(docRef);

    return NextResponse.json(
      { message: "Time log deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting time log:", error);
    return NextResponse.json(
      { error: "Failed to delete time log", details: error.message },
      { status: 500 }
    );
  }
}
