<script lang="ts">
    // This component will only rerender if these props change
    export let username: string;
</script>

<header class="mb-8 border-b border-gray-400 pb-4">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">The Bone Social Web Project</h1>
        <a 
            href="/profile"
            class="border border-gray-500 bg-gray-200 px-4 py-1 hover:bg-gray-300"
        >
            Profile
        </a>
    </div>
    <p class="text-gray-700 mt-2">Welcome, {username}.</p>
</header>