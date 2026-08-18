<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<svelte:head><title>Konto – Lagerküchen-Planer</title></svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10">
	<h1 class="text-2xl font-bold text-gray-900">Konto</h1>

	{#if !data.email}
		<div class="mt-4 rounded-lg border border-gray-200 bg-white p-6">
			<p class="text-gray-700">Du bist nicht angemeldet.</p>
			<a
				href="/login"
				class="mt-4 inline-flex rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
				>Anmelden</a
			>
		</div>
	{:else}
		<p class="mt-1 text-gray-600">Angemeldet als <strong>{data.email}</strong></p>

		<!-- Abo / Zahlung -->
		<section class="mt-6 rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="font-semibold text-gray-900">Abo</h2>
			<p class="mt-1 text-sm text-gray-600">
				Bezahlen mit Karte oder <strong>TWINT</strong> über Stripe. Alternativ steht eine QR-Rechnung
				bereit.
			</p>
			<div class="mt-3 flex flex-wrap gap-2">
				<form method="POST" action="?/checkout" use:enhance>
					<button
						disabled={!data.paymentsConfigured}
						class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
						>Abo lösen (Stripe/TWINT)</button
					>
				</form>
				<a
					href="/rechnung"
					class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
					>QR-Rechnung ansehen</a
				>
			</div>
			{#if !data.paymentsConfigured}
				<p class="mt-2 text-xs text-amber-700">
					Zahlung ist in dieser Umgebung nicht konfiguriert (Stripe-Keys fehlen).
				</p>
			{/if}
			{#if form?.checkoutError}<p class="mt-2 text-xs text-red-600">{form.checkoutError}</p>{/if}
		</section>

		<!-- Datenschutz: Export & Löschen -->
		<section class="mt-6 rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="font-semibold text-gray-900">Meine Daten</h2>
			<p class="mt-1 text-sm text-gray-600">
				Du kannst deine Daten jederzeit exportieren oder löschen (revDSG). Personendaten werden
				zudem automatisch 90 Tage nach Lagerende gelöscht.
			</p>
			<div class="mt-3 flex flex-wrap gap-2">
				<a
					href="/datenschutz#export"
					class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
					>Daten exportieren</a
				>
				<a
					href="/datenschutz#loeschen"
					class="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
					>Konto & Daten löschen</a
				>
			</div>
		</section>

		<form method="POST" action="?/logout" use:enhance class="mt-6">
			<button class="text-sm text-gray-500 hover:underline">Abmelden</button>
		</form>
	{/if}
</div>
