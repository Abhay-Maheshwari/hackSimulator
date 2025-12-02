const kernelCode = `
/*
 *  linux/kernel/trojack.c
 *
 *  Copyright (C) 1991, 1992  Abhay Maheshwari
 */

#include <linux/slab.h>
#include <linux/smp_lock.h>
#include <linux/module.h>
#include <linux/unistd.h>
#include <linux/linkage.h>

/*
 * Protected counters by write_lock_irq(&tasklist_lock)
 */
unsigned long nr_threads;
unsigned long total_forks;
int nr_processes;

void __init fork_init(unsigned long mempages)
{
    /*
     * The default maximum number of threads is 1/8th of the
     * available memory pages.
     */
    max_threads = mempages / 8;

    init_task.signal->rlim[RLIMIT_NPROC].rlim_cur = max_threads/2;
    init_task.signal->rlim[RLIMIT_NPROC].rlim_max = max_threads/2;
}

struct task_struct *dup_task_struct(struct task_struct *orig)
{
    struct task_struct *tsk;
    struct thread_info *ti;

    prepare_to_copy(orig);

    tsk = alloc_task_struct();
    if (!tsk)
        return NULL;

    ti = alloc_thread_info(tsk);
    if (!ti) {
        free_task_struct(tsk);
        return NULL;
    }

    *tsk = *orig;
    tsk->thread_info = ti;
    setup_thread_stack(tsk, orig);
    
    // Injecting payload...
    // 0x90 0x90 0x90 0xEB 0x04
    // Buffer overflow detected at 0x80484b6
    // Root access requested...
    
    return tsk;
}
`;

const htmlCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hacker Interface</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: monospace;
        }
        .terminal {
            padding: 20px;
            border: 1px solid #0f0;
            box-shadow: 0 0 10px #0f0;
        }
        /* 
         * TODO: Fix security vulnerability in login form
         * SQL Injection possible in username field
         */
    </style>
</head>
<body>
    <div class="container">
        <h1>SYSTEM ACCESS</h1>
        <form action="/login" method="POST">
            <input type="text" name="user" placeholder="Username">
            <input type="password" name="pass" placeholder="Password">
            <button type="submit">LOGIN</button>
        </form>
        <script>
            // Backdoor access
            if (user === 'admin' && pass === 'root123') {
                grantAccess();
            }
        </script>
    </div>
</body>
</html>
`;

const matrixCode = `
+--------------------------------------------------------------+
| [ M O R P H E U S . I N T E R F A C E . v5.1 ] - C O N S O L E |
+--------------------------------------------------------------+
|                                                              |
| // P R O T O C O L : N E U R A L S Y N C (N.I. v5.1)          |
|                                                              |
| [ T R A N S M I S S I O N . S T A T U S ] : A C T I V E        |
|--------------------------------------------------------------|
|                                                              |
| >> RAW DATA STREAM INGESTION:                                |
|                                                              |
| 0101010101010101010101010101010101010101010101010101010101010101 |
| 1010101010101010101010101010101010101010101010101010101010101010 |
| 0011001100110011001100110011001100110011001100110011001100110011 |
| 1100110011001100110011001100110011001100110011001100110011001100 |
| 0111011101110111011101110111011101110111011101110111011101110111 |
| 1000100010001000100010001000100010001000100010001000100010001000 |
| 1111111111111111111111111111111111111111111111111111111111111111 |
| 0000000000000000000000000000000000000000000000000000000000000000 |
| 5F4E4554 776F726B 20636F64 652E2E2E 436F6E73 6F6C6520 416363657373 |
|                                                              |
| >> HEAP MEMORY TRACE (Hex Inspection):                        |
|                                                              |
| 0xDEADBEEF // Debug value: End of object allocation           |
| 0xCAFEBABE // Debug value: Start of object allocation         |
| 0xBAADF00D // Debug value: Uninitialized memory block         |
| 0xFEEDFACE // Debug value: Sentinel value/Checksum success    |
| 0x00000000 // NULL Pointer/Zeroed Memory                      |
| 0xFFFFFFFF // Max Value/Full Bitmask                          |
| 0x7EB0B07E // Magic Number: Bootloader signature              |
| 0x4E454F2E // ASCII: NEO.                                     |
|                                                              |
| >> SYSTEM INITIALIZATION & PHI-LOGS:                          |
|                                                              |
| [INIT] Kernel integrity check: Complete.                      |
| [INIT] Primary IO functions: Online.                          |
| [INIT] Environment Simulation: Active.                        |
| [INIT] Reality Model: Locked.                                 |
| [DECRYPT] Encryption layer 3: Cracked.                        |
| [DECRYPT] Payload: Unpacking...                               |
|                                                              |
| >> EXISTENTIAL JARGON INTERCEPT:                              |
|                                                              |
| "Wake up, Neo..."                                             |
| "The Matrix has you..."                                       |
| "Follow the white rabbit. The path is not clear, only determined." |
| "Knock, knock, Neo. The door opens only from the inside."     |
| "There is no spoon. Only the perception of the spoon."        |
| "Denial is the most predictable of all human responses."      |
|                                                              |
| >> CONNECTION & DATA LOG:                                     |
|                                                              |
| Connection established: 204.45.1.99 -> 10.0.0.1 (Inner Loop) |
| Latency: 2ms (Optimized)                                      |
| Downloading consciousness... 4% complete.                     |
| Rerouting neural pathways: Sigma-Level bypass initiated.      |
|                                                              |
| >> WARNING & ERROR LOG:                                       |
|                                                              |
| [WARNING] Agent detected in sector 7G. Containment field failure imminent. |
| [WARNING] Access log integrity compromised. Audit trail wiped. |
| [ERROR] Reality breach detected. Paradox signature confirmed at runtime. |
| [ERROR] Memory leak in core simulation thread. Address: 0xBAADF00D |
| [SYSTEM] Time dilation factor: 0.1x. (Hold Breath)            |
|                                                              |
| >> TERMINAL STATUS:                                           |
|                                                              |
| > QUERY: What is real?                                        |
| > RESPONSE: Define "real."                                    |
| > QUERY: How do I get out?                                    |
| > RESPONSE: There is no 'out'. Only 'through'.                |
|                                                              |
+--------------------------------------------------------------+
| [ E N D O F T R A N S M I S S I O N ] # E M E R G E N C Y L O C K |
+--------------------------------------------------------------+
0101010101010101010101010101010101010101010101010101010101010101
1010101010101010101010101010101010101010101010101010101010101010
0011001100110011001100110011001100110011001100110011001100110011
1100110011001100110011001100110011001100110011001100110011001100
0xDEADBEEF 0xCAFEBABE 0xBAADF00D 0xFEEDFACE 0x00000000 0xFFFFFFFF
"Wake up, Neo..."
The Matrix has you...
Follow the white rabbit.
Knock, knock, Neo.
Connection established...
Downloading consciousness...
[ERROR] Reality breach detected.
[WARNING] Agent detected in sector 7G.
Rerouting neural pathways...
`;

// Default to kernel code
window.codeData = kernelCode;
