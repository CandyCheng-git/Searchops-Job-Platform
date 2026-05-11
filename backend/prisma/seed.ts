import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.event.deleteMany();
    await prisma.experimentAssignment.deleteMany();
    await prisma.job.deleteMany();
    await prisma.company.deleteMany();

    const seek = await prisma.company.create({
        data: {
            name: 'Seek',
            slug: 'seek',
            websiteUrl: 'https://www.seek.com.au',
        },
    });

    const atlassian = await prisma.company.create({
        data: {
            name: 'Atlassian',
            slug: 'atlassian',
            websiteUrl: 'https://www.atlassian.com',
        },
    });

    const canva = await prisma.company.create({
        data: {
            name: 'Canva',
            slug: 'canva',
            websiteUrl: 'https://www.canva.com',
        },
    });

    const xero = await prisma.company.create({
        data: {
            name: 'Xero',
            slug: 'xero',
            websiteUrl: 'https://www.xero.com',
        },
    });

    const rea = await prisma.company.create({
        data: {
            name: 'REA Group',
            slug: 'rea-group',
            websiteUrl: 'https://www.rea-group.com',
        },
    });

    await prisma.job.createMany({
        data: [
            {
                title: 'Backend Software Engineer',
                slug: 'backend-software-engineer-melbourne',
                description:
                    'Build scalable backend services for job search, structured data, and platform reliability.',
                location: 'Melbourne, VIC',
                category: 'SOFTWARE_ENGINEERING',
                workMode: 'HYBRID',
                employmentType: 'FULL_TIME',
                salaryMin: 100000,
                salaryMax: 130000,
                companyId: seek.id,
            },
            {
                title: 'Data Analyst',
                slug: 'data-analyst-sydney',
                description:
                    'Analyse product, search, and conversion data to support better marketplace decisions.',
                location: 'Sydney, NSW',
                category: 'DATA_ANALYTICS',
                workMode: 'HYBRID',
                employmentType: 'FULL_TIME',
                salaryMin: 85000,
                salaryMax: 110000,
                companyId: atlassian.id,
            }

            // Add 18 more records.
        ],
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });