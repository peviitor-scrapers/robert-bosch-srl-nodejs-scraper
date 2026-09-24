import { jest } from '@jest/globals';

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    index = await import('../../scraper/index.js');
  });

  describe('transformJobsForSOLR', () => {
    it('should filter locations to only Romanian cities', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: ['România'] },
          { url: 'https://test.com/2', title: 'Job 2', location: ['Bucharest'] },
          { url: 'https://test.com/3', title: 'Job 3', location: ['Bulgaria'] },
          { url: 'https://test.com/4', title: 'Job 4', location: ['Cluj-Napoca'] },
          { url: 'https://test.com/5', title: 'Job 5', location: [] }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].location).toEqual(['România']);
      expect(result.jobs[1].location).toEqual(['Bucharest']);
      expect(result.jobs[2].location).toEqual(['România']);
      expect(result.jobs[3].location).toEqual(['Cluj-Napoca']);
      expect(result.jobs[4].location).toEqual(['România']);
    });

    it('should keep company uppercase', () => {
      const payload = {
        source: 'smartrecruiters.com',
        company: 'robert bosch srl',
        cif: '5541546',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'robert bosch', cif: '5541546' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('ROBERT BOSCH SRL');
    });

    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' },
          { url: 'https://test.com/4', title: 'Job 4', workmode: 'hybrid' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
      expect(result.jobs[3].workmode).toBe('hybrid');
    });

    it('should handle empty jobs array', () => {
      const result = index.transformJobsForSOLR({ jobs: [] });
      expect(result.jobs).toEqual([]);
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://jobs.smartrecruiters.com/BoschGroup/123-senior-developer',
        title: 'Senior Developer',
        location: ['Bucharest'],
        tags: ['information-technology', 'engineering'],
        workmode: 'hybrid'
      };

      const COMPANY_NAME = 'ROBERT BOSCH SRL';
      const COMPANY_CIF = '5541546';

      const result = index.mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(COMPANY_CIF);
      expect(result.location).toEqual(rawJob.location);
      expect(result.tags).toEqual(rawJob.tags);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
      expect(result.date).toBeDefined();
    });

    it('should remove undefined fields', () => {
      const rawJob = {
        url: 'https://test.com/1',
        title: 'Job 1'
      };

      const result = index.mapToJobModel(rawJob, '5541546');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });

    it('should handle missing title', () => {
      const rawJob = { url: 'https://test.com/1' };

      const result = index.mapToJobModel(rawJob, '5541546');

      expect(result.title).toBeUndefined();
      expect(result.url).toBe('https://test.com/1');
    });
  });

  describe('parseApiJobs', () => {
    it('should parse SmartRecruiters API response format', () => {
      const apiData = {
        totalFound: 66,
        content: [
          {
            id: '123',
            name: 'Senior Developer',
            location: { city: 'Cluj-Napoca', country: 'ro', hybrid: true },
            industry: { label: 'Information Technology And Services' },
            function: { label: 'Information Technology' }
          }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Senior Developer');
      expect(result[0].location).toEqual(['Cluj-Napoca']);
      expect(result[0].workmode).toBe('hybrid');
      expect(result[0].tags).toEqual(['information-technology-and-services', 'information-technology']);
    });

    it('should filter out non-Romania jobs', () => {
      const apiData = {
        totalFound: 1,
        content: [
          { id: '1', name: 'Job DE', location: { city: 'Stuttgart', country: 'de' } }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result).toEqual([]);
    });

    it('should handle empty content list', () => {
      const apiData = { totalFound: 0, content: [] };

      const result = index.parseApiJobs(apiData);

      expect(result).toEqual([]);
    });

    it('should handle missing content field', () => {
      const result = index.parseApiJobs({});

      expect(result).toEqual([]);
    });

    it('should default to on-site when neither remote nor hybrid is set', () => {
      const apiData = {
        totalFound: 1,
        content: [
          { id: '1', name: 'Office Job', location: { city: 'București', country: 'ro' } }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result[0].workmode).toBe('on-site');
    });

    it('should mark remote jobs correctly', () => {
      const apiData = {
        totalFound: 1,
        content: [
          { id: '1', name: 'Remote Job', location: { city: 'Timișoara', country: 'ro', remote: true } }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result[0].workmode).toBe('remote');
    });
  });

  describe('URL Generation', () => {
    it('should build a slugified URL from job id and name', () => {
      const apiData = {
        totalFound: 1,
        content: [
          { id: '744000151302709', name: 'SAP Cutover Manager', location: { city: 'Timișoara', country: 'ro' } }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result[0].url).toBe('https://jobs.smartrecruiters.com/BoschGroup/744000151302709-sap-cutover-manager');
    });

    it('should fall back to id-only URL when name is missing', () => {
      const apiData = {
        totalFound: 1,
        content: [
          { id: '999', location: { city: 'București', country: 'ro' } }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result[0].url).toBe('https://jobs.smartrecruiters.com/BoschGroup/999');
    });
  });
});
