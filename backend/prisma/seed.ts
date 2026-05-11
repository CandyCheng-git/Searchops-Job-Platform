import {
  EmploymentType,
  JobCategory,
  PrismaClient,
  WorkMode,
  type Prisma,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany();
  await prisma.experimentAssignment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();

  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'SEEK',
        slug: 'seek',
        websiteUrl: 'https://www.seek.com.au',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Atlassian',
        slug: 'atlassian',
        websiteUrl: 'https://www.atlassian.com',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Canva',
        slug: 'canva',
        websiteUrl: 'https://www.canva.com',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Xero',
        slug: 'xero',
        websiteUrl: 'https://www.xero.com/au',
      },
    }),
    prisma.company.create({
      data: {
        name: 'REA Group',
        slug: 'rea-group',
        websiteUrl: 'https://www.rea-group.com',
      },
    }),
    prisma.company.create({
      data: {
        name: 'SafetyCulture',
        slug: 'safetyculture',
        websiteUrl: 'https://safetyculture.com',
      },
    }),
  ]);

  const companyBySlug = new Map(companies.map((company) => [company.slug, company]));
  const companyId = (slug: string) => {
    const company = companyBySlug.get(slug);

    if (!company) {
      throw new Error(`Seed company not found: ${slug}`);
    }

    return company.id;
  };

  const jobs: Prisma.JobCreateManyInput[] = [
    {
      title: 'Backend Software Engineer',
      slug: 'backend-software-engineer-melbourne-seek',
      description:
        'Build scalable backend services for job search, structured data, and marketplace reliability.',
      location: 'Melbourne, VIC',
      category: JobCategory.SOFTWARE_ENGINEERING,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 110000,
      salaryMax: 145000,
      datePosted: new Date('2026-05-01T00:00:00.000Z'),
      validThrough: new Date('2026-06-14T00:00:00.000Z'),
      companyId: companyId('seek'),
    },
    {
      title: 'Frontend Software Engineer',
      slug: 'frontend-software-engineer-remote-australia-seek',
      description:
        'Create accessible job discovery interfaces used by candidates across Australia.',
      location: 'Remote Australia',
      category: JobCategory.SOFTWARE_ENGINEERING,
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 105000,
      salaryMax: 135000,
      datePosted: new Date('2026-05-03T00:00:00.000Z'),
      validThrough: new Date('2026-06-17T00:00:00.000Z'),
      companyId: companyId('seek'),
    },
    {
      title: 'Search Quality Data Analyst',
      slug: 'search-quality-data-analyst-melbourne-seek',
      description:
        'Analyse search, filter, and conversion patterns to improve marketplace matching quality.',
      location: 'Melbourne, VIC',
      category: JobCategory.DATA_ANALYTICS,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.CONTRACT,
      salaryMin: 100000,
      salaryMax: 125000,
      datePosted: new Date('2026-04-26T00:00:00.000Z'),
      validThrough: new Date('2026-06-05T00:00:00.000Z'),
      companyId: companyId('seek'),
    },
    {
      title: 'Product Manager, Job Seeker Experience',
      slug: 'product-manager-job-seeker-experience-sydney-seek',
      description:
        'Lead discovery and delivery for job seeker workflows across search, alerts, and applications.',
      location: 'Sydney, NSW',
      category: JobCategory.PRODUCT,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 130000,
      salaryMax: 160000,
      datePosted: new Date('2026-04-29T00:00:00.000Z'),
      validThrough: new Date('2026-06-10T00:00:00.000Z'),
      companyId: companyId('seek'),
    },
    {
      title: 'Cloud Platform Engineer',
      slug: 'cloud-platform-engineer-sydney-atlassian',
      description:
        'Operate cloud platform services that support reliable collaboration products at scale.',
      location: 'Sydney, NSW',
      category: JobCategory.CLOUD_DEVOPS,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 140000,
      salaryMax: 180000,
      datePosted: new Date('2026-05-02T00:00:00.000Z'),
      validThrough: new Date('2026-06-16T00:00:00.000Z'),
      companyId: companyId('atlassian'),
    },
    {
      title: 'Security Engineer',
      slug: 'security-engineer-remote-australia-atlassian',
      description:
        'Strengthen application security controls, threat detection, and secure development practices.',
      location: 'Remote Australia',
      category: JobCategory.CYBERSECURITY,
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 135000,
      salaryMax: 175000,
      datePosted: new Date('2026-04-24T00:00:00.000Z'),
      validThrough: new Date('2026-06-08T00:00:00.000Z'),
      companyId: companyId('atlassian'),
    },
    {
      title: 'Software Engineering Intern',
      slug: 'software-engineering-intern-sydney-atlassian',
      description:
        'Join a product engineering team for a paid internship focused on backend and frontend delivery.',
      location: 'Sydney, NSW',
      category: JobCategory.SOFTWARE_ENGINEERING,
      workMode: WorkMode.ONSITE,
      employmentType: EmploymentType.INTERNSHIP,
      salaryMin: 60000,
      salaryMax: 70000,
      datePosted: new Date('2026-05-05T00:00:00.000Z'),
      validThrough: new Date('2026-06-20T00:00:00.000Z'),
      companyId: companyId('atlassian'),
    },
    {
      title: 'Product Designer, Collaboration Tools',
      slug: 'product-designer-collaboration-tools-brisbane-atlassian',
      description:
        'Design collaboration experiences for software teams, from research through production delivery.',
      location: 'Brisbane, QLD',
      category: JobCategory.DESIGN,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.CONTRACT,
      salaryMin: 110000,
      salaryMax: 135000,
      datePosted: new Date('2026-04-27T00:00:00.000Z'),
      validThrough: new Date('2026-06-09T00:00:00.000Z'),
      companyId: companyId('atlassian'),
    },
    {
      title: 'Senior Frontend Engineer',
      slug: 'senior-frontend-engineer-sydney-canva',
      description:
        'Build high-quality creative tooling with performance, accessibility, and design craft in mind.',
      location: 'Sydney, NSW',
      category: JobCategory.SOFTWARE_ENGINEERING,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 140000,
      salaryMax: 180000,
      datePosted: new Date('2026-05-06T00:00:00.000Z'),
      validThrough: new Date('2026-06-21T00:00:00.000Z'),
      companyId: companyId('canva'),
    },
    {
      title: 'Data Analytics Engineer',
      slug: 'data-analytics-engineer-remote-australia-canva',
      description:
        'Model product analytics data and build trusted datasets for experimentation and reporting.',
      location: 'Remote Australia',
      category: JobCategory.DATA_ANALYTICS,
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 125000,
      salaryMax: 155000,
      datePosted: new Date('2026-05-04T00:00:00.000Z'),
      validThrough: new Date('2026-06-18T00:00:00.000Z'),
      companyId: companyId('canva'),
    },
    {
      title: 'Visual Designer',
      slug: 'visual-designer-melbourne-canva',
      description:
        'Create polished visual systems and product assets for creative workflows and brand moments.',
      location: 'Melbourne, VIC',
      category: JobCategory.DESIGN,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 95000,
      salaryMax: 125000,
      datePosted: new Date('2026-04-30T00:00:00.000Z'),
      validThrough: new Date('2026-06-13T00:00:00.000Z'),
      companyId: companyId('canva'),
    },
    {
      title: 'Product Manager, Creative Workflows',
      slug: 'product-manager-creative-workflows-sydney-canva',
      description:
        'Shape roadmap priorities for creative workflow features used by teams and small businesses.',
      location: 'Sydney, NSW',
      category: JobCategory.PRODUCT,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 135000,
      salaryMax: 170000,
      datePosted: new Date('2026-04-23T00:00:00.000Z'),
      validThrough: new Date('2026-06-07T00:00:00.000Z'),
      companyId: companyId('canva'),
    },
    {
      title: 'Site Reliability Engineer',
      slug: 'site-reliability-engineer-melbourne-xero',
      description:
        'Improve service reliability, deployment safety, and observability for accounting platform teams.',
      location: 'Melbourne, VIC',
      category: JobCategory.CLOUD_DEVOPS,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 130000,
      salaryMax: 165000,
      datePosted: new Date('2026-05-01T00:00:00.000Z'),
      validThrough: new Date('2026-06-15T00:00:00.000Z'),
      companyId: companyId('xero'),
    },
    {
      title: 'Cybersecurity Analyst',
      slug: 'cybersecurity-analyst-brisbane-xero',
      description:
        'Monitor security signals, investigate incidents, and improve controls for customer data protection.',
      location: 'Brisbane, QLD',
      category: JobCategory.CYBERSECURITY,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 105000,
      salaryMax: 135000,
      datePosted: new Date('2026-04-28T00:00:00.000Z'),
      validThrough: new Date('2026-06-11T00:00:00.000Z'),
      companyId: companyId('xero'),
    },
    {
      title: 'Part-Time UX Researcher',
      slug: 'part-time-ux-researcher-remote-australia-xero',
      description:
        'Run customer research and usability studies for small business accounting workflows.',
      location: 'Remote Australia',
      category: JobCategory.DESIGN,
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.PART_TIME,
      salaryMin: 70000,
      salaryMax: 90000,
      datePosted: new Date('2026-05-07T00:00:00.000Z'),
      validThrough: new Date('2026-06-19T00:00:00.000Z'),
      companyId: companyId('xero'),
    },
    {
      title: 'Software Engineering Intern',
      slug: 'software-engineering-intern-melbourne-xero',
      description:
        'Contribute to product engineering tasks while learning testing, code review, and delivery practices.',
      location: 'Melbourne, VIC',
      category: JobCategory.SOFTWARE_ENGINEERING,
      workMode: WorkMode.ONSITE,
      employmentType: EmploymentType.INTERNSHIP,
      salaryMin: 58000,
      salaryMax: 65000,
      datePosted: new Date('2026-05-08T00:00:00.000Z'),
      validThrough: new Date('2026-06-22T00:00:00.000Z'),
      companyId: companyId('xero'),
    },
    {
      title: 'Full Stack Engineer',
      slug: 'full-stack-engineer-melbourne-rea-group',
      description:
        'Deliver property search features across backend APIs, frontend interfaces, and platform tooling.',
      location: 'Melbourne, VIC',
      category: JobCategory.SOFTWARE_ENGINEERING,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 120000,
      salaryMax: 155000,
      datePosted: new Date('2026-05-02T00:00:00.000Z'),
      validThrough: new Date('2026-06-16T00:00:00.000Z'),
      companyId: companyId('rea-group'),
    },
    {
      title: 'Data Analyst, Property Insights',
      slug: 'data-analyst-property-insights-brisbane-rea-group',
      description:
        'Turn property marketplace data into clear insights for product, commercial, and leadership teams.',
      location: 'Brisbane, QLD',
      category: JobCategory.DATA_ANALYTICS,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.CONTRACT,
      salaryMin: 95000,
      salaryMax: 120000,
      datePosted: new Date('2026-04-25T00:00:00.000Z'),
      validThrough: new Date('2026-06-06T00:00:00.000Z'),
      companyId: companyId('rea-group'),
    },
    {
      title: 'DevOps Engineer',
      slug: 'devops-engineer-remote-australia-rea-group',
      description:
        'Improve deployment pipelines, infrastructure automation, and runtime reliability for product teams.',
      location: 'Remote Australia',
      category: JobCategory.CLOUD_DEVOPS,
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.CONTRACT,
      salaryMin: 125000,
      salaryMax: 160000,
      datePosted: new Date('2026-05-05T00:00:00.000Z'),
      validThrough: new Date('2026-06-20T00:00:00.000Z'),
      companyId: companyId('rea-group'),
    },
    {
      title: 'Product Designer, Consumer Search',
      slug: 'product-designer-consumer-search-sydney-rea-group',
      description:
        'Design property search and discovery experiences for renters, buyers, and sellers.',
      location: 'Sydney, NSW',
      category: JobCategory.DESIGN,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 110000,
      salaryMax: 140000,
      datePosted: new Date('2026-04-22T00:00:00.000Z'),
      validThrough: new Date('2026-06-04T00:00:00.000Z'),
      companyId: companyId('rea-group'),
    },
    {
      title: 'Mobile Software Engineer',
      slug: 'mobile-software-engineer-sydney-safetyculture',
      description:
        'Build mobile product features that help frontline teams complete inspections and manage risk.',
      location: 'Sydney, NSW',
      category: JobCategory.SOFTWARE_ENGINEERING,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 120000,
      salaryMax: 150000,
      datePosted: new Date('2026-05-06T00:00:00.000Z'),
      validThrough: new Date('2026-06-21T00:00:00.000Z'),
      companyId: companyId('safetyculture'),
    },
    {
      title: 'Cloud Security Engineer',
      slug: 'cloud-security-engineer-remote-australia-safetyculture',
      description:
        'Secure cloud infrastructure, improve detection coverage, and partner with engineering teams.',
      location: 'Remote Australia',
      category: JobCategory.CYBERSECURITY,
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 135000,
      salaryMax: 170000,
      datePosted: new Date('2026-04-29T00:00:00.000Z'),
      validThrough: new Date('2026-06-12T00:00:00.000Z'),
      companyId: companyId('safetyculture'),
    },
  ];

  await prisma.job.createMany({ data: jobs });

  console.log(`Seeded ${companies.length} companies and ${jobs.length} jobs.`);
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
