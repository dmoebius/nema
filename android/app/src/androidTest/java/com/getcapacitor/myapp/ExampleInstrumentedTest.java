package com.getcapacitor.myapp;

import static org.junit.jupiter.api.Assertions.*;

import android.content.Context;
import androidx.test.platform.app.InstrumentationRegistry;
import de.mannodermaus.junit5.ActivityScenarioExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
class ExampleInstrumentedTest {

    @Test
    void useAppContext() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("de.dmoebius.nema", appContext.getPackageName());
    }
}
