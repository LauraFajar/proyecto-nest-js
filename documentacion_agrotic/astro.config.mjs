// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Documentación',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
				sidebar: [
					{
						label: 'Documentación',
						autogenerate: { directory: 'documentacion' },
					},
				{
					label: 'Login',
					items: [
						{ label: 'autenticacion ', slug: 'login/auth' },
					],
				},
				{
					label: 'usuarios',
					autogenerate: { directory: 'usuarios' },
				},
				{
					label: 'finanzas',
					autogenerate: { directory: 'finanzas' },
				},
				{
					label: 'iot',
					autogenerate: { directory: 'iot' },
				},
				{
					label: 'Fitosanitario',
					autogenerate: { directory: 'fitosanitario' },
				},
				{
					label: 'inventario',
					autogenerate: { directory: 'inventario' },
				},
				{
					label: 'cultivos',
					autogenerate: { directory: 'cultivos' },
				}
			],
		}),
	],
});
