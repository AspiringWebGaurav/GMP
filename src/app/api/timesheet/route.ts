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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const timesheetRef = collection(db, "timesheetEntries");
    const q = query(timesheetRef, where("userId", "==", userId));

    const queryPromise = getDocs(q);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), 15000)
    );

    const querySnapshot = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as any;

    const entries = querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        date: data.date?.toDate?.().toISOString() || data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration || 0,
        description: data.description || "",
        tags: data.tags || [],
        isDraft: data.isDraft || false,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
      };
    });

    // Filter by date range if provided
    let filtered = entries;
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filtered = entries.filter((entry: any) => {
        const entryDate = new Date(entry.date).getTime();
        return entryDate >= start && entryDate <= end;
      });
    }

    // Sort by date and start time
    filtered.sort((a: any, b: any) => {
      const dateCompare =
        new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({ entries: filtered }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching timesheet entries:", error);

    if (error.message === "Query timeout") {
      return NextResponse.json({ entries: [] }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Failed to fetch entries", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      date,
      startTime,
      endTime,
      duration,
      description,
      tags,
      isDraft,
    } = body;

    if (!userId || !date || !startTime) {
      return NextResponse.json(
        { error: "User ID, date, and start time are required" },
        { status: 400 }
      );
    }

    const timesheetRef = collection(db, "timesheetEntries");
    const docRef = await addDoc(timesheetRef, {
      userId,
      date: Timestamp.fromDate(new Date(date)),
      startTime,
      endTime: endTime || null,
      duration: duration || 0,
      description: description || "",
      tags: tags || [],
      isDraft: isDraft || false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: "Timesheet entry created",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating timesheet entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, startTime, endTime, duration, description, tags, isDraft } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "timesheetEntries", id);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (duration !== undefined) updateData.duration = duration;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (isDraft !== undefined) updateData.isDraft = isDraft;

    await updateDoc(docRef, updateData);

    return NextResponse.json(
      { success: true, message: "Entry updated" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating timesheet entry:", error);
    return NextResponse.json(
      { error: "Failed to update entry", details: error.message },
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
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "timesheetEntries", id));

    return NextResponse.json(
      { success: true, message: "Entry deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting timesheet entry:", error);
    return NextResponse.json(
      { error: "Failed to delete entry", details: error.message },
      { status: 500 }
    );
  }
}
