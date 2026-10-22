import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { parse as parseYaml } from 'yaml';
import { app } from '../app';

const SKILLS_DIRECTORY = path.join(__dirname, '../skills');
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/v;
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_DESCRIPTION_MAX_LENGTH = 1024;
const FRONTMATTER_PATTERN = /^---\n(?<frontmatter>.*?)\n---\n/sv;

interface SkillFrontmatter {
	name: string;
	description: string;
}

const isSkillFrontmatter = (value: unknown): value is SkillFrontmatter =>
	typeof value === 'object' &&
	value !== null &&
	'name' in value &&
	typeof value.name === 'string' &&
	'description' in value &&
	typeof value.description === 'string';

const loadSkillDirectoryNames = async () => {
	const entries = await fs.readdir(SKILLS_DIRECTORY, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.toSorted();
};

const loadSkill = async (directoryName: string) => {
	const definition = await fs.readFile(
		path.join(SKILLS_DIRECTORY, directoryName, 'SKILL.md'),
	);
	const frontmatter: unknown = parseYaml(
		FRONTMATTER_PATTERN.exec(definition.toString('utf8'))?.groups
			?.frontmatter ?? '',
	);
	if (!isSkillFrontmatter(frontmatter)) {
		throw new Error(
			`The "${directoryName}" skill is missing a name or description.`,
		);
	}
	return {
		directoryName,
		frontmatter,
		digest: `sha256:${createHash('sha256').update(definition).digest('hex')}`,
	};
};

const loadSkills = async () =>
	await Promise.all((await loadSkillDirectoryNames()).map(loadSkill));

describe('/.well-known/agent-skills', () => {
	describe('GET /index.json', () => {
		it('describes every agent skill as its SKILL.md declares it, without authentication', async () => {
			const skills = await loadSkills();

			const response = await request(app)
				.get('/.well-known/agent-skills/index.json')
				.expect('Content-Type', /^application\/json/v)
				.expect(200);

			expect(response.body).toEqual({
				$schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
				skills: skills.map(({ directoryName, frontmatter, digest }) => ({
					name: frontmatter.name,
					type: 'skill-md',
					description: frontmatter.description,
					url: `${directoryName}/SKILL.md`,
					digest,
				})),
			});
		});
	});

	describe('GET /:skillName/SKILL.md', () => {
		it('returns the agent skill as markdown without authentication', async () => {
			const response = await request(app)
				.get('/.well-known/agent-skills/philanthropy-data-commons/SKILL.md')
				.expect('Content-Type', /^text\/markdown/v)
				.expect(200);

			expect(response.text).toContain('name: philanthropy-data-commons');
		});

		it('returns 404 when the agent skill does not exist', async () => {
			await request(app)
				.get('/.well-known/agent-skills/not-a-skill/SKILL.md')
				.expect(404);
		});

		it('returns 404 rather than redirecting when a skill directory is requested', async () => {
			await request(app)
				.get('/.well-known/agent-skills/philanthropy-data-commons')
				.expect(404);
		});
	});

	describe('skill definitions', () => {
		it('name each agent skill after its directory', async () => {
			const skills = await loadSkills();

			expect(skills.map(({ frontmatter }) => frontmatter.name)).toEqual(
				skills.map(({ directoryName }) => directoryName),
			);
		});

		it('give each agent skill a valid name and description', async () => {
			const skills = await loadSkills();

			skills.forEach(({ frontmatter: { name, description } }) => {
				expect(name).toMatch(SKILL_NAME_PATTERN);
				expect(name.length).toBeLessThanOrEqual(SKILL_NAME_MAX_LENGTH);
				expect(description.trim()).not.toBe('');
				expect(description.length).toBeLessThanOrEqual(
					SKILL_DESCRIPTION_MAX_LENGTH,
				);
			});
		});

		it('contain nothing but a SKILL.md', async () => {
			const directoryNames = await loadSkillDirectoryNames();

			const contents = await Promise.all(
				directoryNames.map(
					async (directoryName) =>
						await fs.readdir(path.join(SKILLS_DIRECTORY, directoryName)),
				),
			);

			expect(contents).toEqual(directoryNames.map(() => ['SKILL.md']));
		});
	});
});
