# Kinoticketreservervierungssystem
## Collaborating (kleiner git-guide)
Hier ein kurzer guide mit den wichtigsten git Befehlen, um effektiv zusammenzuarbeiten. Und ein paar good practices, an die wir uns alle halten sollten.

Dieses Repository klont man mit folgendem Befehl:
- `git clone https://github.com/kinoticketing/ui`

Um Änderungen, die bereits auf das Repository gepusht wurden, lokal "herunterzuladen", verwende folgenden Befehl:
- `git pull`

> [!CAUTION] 
> Niemals auf main pushen!
> 
> Wir arbeiten mit Branches. So ist sichergestellt, dass der main-Branch immer heil bleibt.
>
> Wenn ihr an etwas arbeitet, erstellt einen Branch, auf dem ihr entwickelt.
>
> - `git branch [NAME]`
> - `git checkout [NAME]`
> - `git commit -m "FEAT: implemented checkout button"` 
>   - **"FEAT" für feature-Entwicklung benutzen**
>   - **"FIX" für Entwicklung rund um Fehlerbehebung benutzen**
> - `git push -u origin [NAME]`
>
> Sofern das Feature fertig entwickelt ist, muss eine pull request angelegt werden, die den Feature Branch mit dem main Branch merged.
> 
> Sobald alle Änderungen auf den Branch gepusht wurden, könnt ihr in dem Repository auf GitHub auf euren Branch navigieren und unter "Contribute" auf "Open pull request" drücken.
> 
> Dann evtl nen Titel und eine kurze Beschreibung hinzufügen und einen reviewer. Schließlich dann auf Create pull request und dann schauen wir ob der bereit zum mergen ist.
  