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

    const donation = await prisma.donationInKind.findUnique({
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
    console.error("Error fetching in-kind donation:", error);
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

    const donation = await prisma.donationInKind.update({
      where: { id: params.id },
      data: {
        ...body,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
      include: {
        donor: true,
      },
    });

    return NextResponse.json(donation);
  } catch (error) {
    console.error("Error updating in-kind donation:", error);
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

    const donation = await prisma.donationInKind.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(donation);
  } catch (error) {
    console.error("Error deleting in-kind donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
