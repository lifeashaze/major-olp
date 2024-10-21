import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

// Initialize PrismaClient
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  console.log('Prisma instance:', prisma);
  console.log('Notification model:', prisma.notification);

  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!prisma.notification) {
      console.error('prisma.notification is undefined');
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        users: {
          some: {
            id: userId
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Fetched notifications:', notifications);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}