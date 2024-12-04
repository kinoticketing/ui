<script lang=ts>
    import { writable } from 'svelte/store';
  
    // @ts-ignore
    let row_count: int;
    // @ts-ignore
    let col_count: int;
  
    // @ts-ignore
    let rows = writable([]); // Array von Arrays für die Sitzplätze
  
    function addRow() {
      // @ts-ignore
      rows.update((r) => [...r, []]);
    }
  
    function removeRow() {
      rows.update((r) => r.slice(0, -1));
    }

    function removeAll() {
      rows.update((r) => []);
    }
  
    // @ts-ignore
    function addColumn(rowIndex) {
      rows.update((r) => {
        // @ts-ignore
        r[rowIndex].push("Sitz");
        return r;
      });
    }
  
    // @ts-ignore
    function removeColumn(rowIndex) {
      rows.update((r) => {
        // @ts-ignore
        r[rowIndex].pop();
        return r;
      });
    }
  
    function addColumnToAllRows() {
      // @ts-ignore
      rows.update((r) => {
        return r.map((row) => [...row, "Sitz"]);
      });
    }

    function preview() {
      // @ts-ignore
      for (let i = 0; i < row_count; i++) {
        addRow();
      }
      for (let i = 0; i < col_count; i++) {
        addColumnToAllRows();
      }
    }
  </script>

  <main>
    <h1>Saal anlegen</h1>
    
    <div class="container">
      <div class="seat-grid">
        {#each $rows as row, rowIndex}
          <div class="seat-row">
            {#each row as seat}
              <div class="seat">{seat}</div>
            {/each}
            <button on:click={() => addColumn(rowIndex)}>+</button>
            <button on:click={() => removeColumn(rowIndex)}>-</button>
          </div>
        {/each}
      </div>
    
      <div class="row-buttons">
        <button on:click={addRow}>Reihe hinzufügen</button>
        <button on:click={removeRow}>Reihe entfernen</button>
        <button on:click={addColumnToAllRows}>Spalte zu allen Reihen hinzufügen</button>
        <button on:click={removeAll}>Alle Reihen löschen</button>
      </div>
      <div class="inputs">
        <input type="text" placeholder="Name des Saals" />
        <input type="number" placeholder="Anzahl Reihen" bind:value={row_count} />
        <input type="number" placeholder="Anzahl Sitze pro Reihe" bind:value={col_count} />
        <button on:click={preview}>Speichern</button>
      </div>
    </div>

  </main>
  
  <style>
    h1 {
      text-align: center;
      margin: 20px 0;
    }
  
    .container {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
  
    .seat-grid {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
  
    .seat-row {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  
    .seat {
      width: 40px;
      height: 40px;
      border: 1px solid #ccc;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f9f9f9;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
    }
  
    .seat-row button {
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      cursor: pointer;
    }
  
    .seat-row button:hover {
      background-color: #0056b3;
    }
  
    .row-buttons {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
    }
  
    .row-buttons button {
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    }
  
    .row-buttons button:hover {
      background-color: #218838;
    }

    .inputs {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
    }

    .inputs button {
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
  
  
  