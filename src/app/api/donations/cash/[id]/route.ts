import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const donation = await prisma.donationCash.findUnique({
      where: { id: params.id },
      include: {
        donor: true,
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(donation);
  } catch (error) {
    console.error("Error fetching cash donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const donation = await prisma.donationCash.update({
      where: { id: params.id },
      data: {
        ...body,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : undefined,
      },
      include: {
        donor: true,
      },
    });

    return NextResponse.json(donation);
  } catch (error) {
    console.error("Error updating cash donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const donation = await prisma.donationCash.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(donation);
  } catch (error) {
    console.error("Error deleting cash donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
