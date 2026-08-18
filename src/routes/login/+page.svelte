<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<svelte:head><title>Anmelden – Lagerküchen-Planer</title></svelte:head>

<div class="mx-auto max-w-md px-4 py-12">
	<h1 class="text-2xl font-bold text-gray-900">Anmelden</h1>
	<p class="mt-1 text-gray-600">
		Wir schicken dir einen Login-Link per E-Mail (Magic Link, 15 Min. gültig). Kein Passwort nötig.
	</p>

	{#if !data.authConfigured}
		<div class="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
			Hinweis: Login ist in dieser Umgebung noch nicht konfiguriert (es fehlt <code
				>AUTH_SECRET</code
			> und ein Mail-Key). Die Maske funktioniert, versendet aber erst mit gesetzten Env-Variablen.
		</div>
	{/if}

	{#if form?.sent}
		<div class="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
			Wenn ein Konto existiert, ist der Login-Link unterwegs. Prüfe dein Postfach.
			{#if !form.delivered}
				<div class="mt-1 text-xs text-emerald-700">
					(Dev: der Link wurde serverseitig ins Log geschrieben, nicht versendet.)
				</div>
			{/if}
		</div>
	{:else}
		<form method="POST" use:enhance class="mt-6 space-y-3">
			<input
				type="email"
				name="email"
				required
				placeholder="du@verein.ch"
				value={form && 'email' in form ? (form.email ?? '') : ''}
				class="w-full rounded border-gray-300"
			/>
			{#if form?.error}<p class="text-sm text-red-600">{form.error}</p>{/if}
			<button
				class="w-full rounded-md bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700"
				>Login-Link senden</button
			>
		</form>
	{/if}

	<p class="mt-6 text-xs text-gray-400">
		Mit der Anmeldung stimmst du der <a class="underline" href="/datenschutz"
			>Datenschutzerklärung</a
		>
		zu.
	</p>
</div>
