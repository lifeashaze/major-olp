import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const classroomId = parseInt(params.id, 10);
    if (isNaN(classroomId)) {
      return NextResponse.json({ error: 'Invalid classroom ID' }, { status: 400 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        admin: true,
        memberships: {
          include: {
            user: true
          }
        }
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Check if the user is the admin or a member of the classroom
    const isAdmin = classroom.adminId === userId;
    const isMember = classroom.memberships.some(membership => membership.userId === userId);

    if (!isAdmin && !isMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const members = classroom.memberships.map(membership => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
    }));

    return NextResponse.json({
      classroom: {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        inviteLink: classroom.inviteLink,
      },
      members: members,
    });
  } catch (error) {
    console.error('Error fetching classroom:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}